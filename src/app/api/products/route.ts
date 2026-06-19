import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateEAN13 } from "@/utils/barcode";
import { uploadFiles } from "@/lib/upload";

// Add new product
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const quantity = formData.get("quantity") as string;
    const description = (formData.get("description") as string) || null;
    const price = (formData.get("price") as string) || null;
    const category = (formData.get("category") as string) || null;
    const salesChannelsRaw = formData.get("sales_channels") as string;
    const salesChannels: string[] = Array.from(
      new Set(salesChannelsRaw ? JSON.parse(salesChannelsRaw) : [])
    );
    const deliveryMethodsRaw = formData.get("delivery_methods") as string;
    const rawDeliveryMethods: string[] = deliveryMethodsRaw ? JSON.parse(deliveryMethodsRaw) : [];

    // Auto-map sales channels to delivery methods
    const deliveryMethodsSet = new Set(rawDeliveryMethods);
    if (salesChannels.includes("ozon")) {
      deliveryMethodsSet.add("ozon");
    }
    if (salesChannels.includes("wildberries")) {
      deliveryMethodsSet.add("wb");
    }
    if (salesChannels.includes("yandex_market")) {
      deliveryMethodsSet.add("yandex");
    }
    const deliveryMethods = Array.from(deliveryMethodsSet);

    // File processing
    const files: File[] = [];
    const photoEntries = formData.getAll("photos");

    for (const photoEntry of photoEntries) {
      if (photoEntry instanceof File && photoEntry.size > 0) {
        files.push(photoEntry);
      }
    }

    // Generate unique barcode
    let barcode = generateEAN13("200");
    let isUnique = false;

    while (!isUnique) {
      const result = await pool.query(
        "SELECT * FROM products WHERE barcode = $1",
        [barcode]
      );
      if (result.rows.length === 0) isUnique = true;
      else barcode = generateEAN13("200");
    }

    // Upload files
    const photoPaths = files.length > 0 ? await uploadFiles(files) : [];

    // Add product to the database
    await pool.query(
      "INSERT INTO products (name, quantity, barcode, photo_paths, description, price, category, sales_channels, delivery_methods) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        name,
        quantity ? parseInt(quantity, 10) : null,
        barcode,
        JSON.stringify(photoPaths),
        description,
        price ? parseFloat(price) : null,
        category,
        salesChannels,
        deliveryMethods,
      ]
    );

    return NextResponse.json(
      {
        message: `Товар добавлен с артикулом: ${barcode}`,
        barcode: barcode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка при добавлении товара:", error);
    return NextResponse.json(
      {
        error: "Ошибка при добавлении товара",
      },
      { status: 500 }
    );
  }
}

// Get products list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const salesChannel = searchParams.get("sales_channel") || "";
    const deliveryMethod = searchParams.get("delivery_method") || "";
    const noDelivery = searchParams.get("no_delivery") || "";
    const sort = searchParams.get("sort") || "";
    const order = searchParams.get("order") || "";
    const page = searchParams.get("page") || "";
    const limit = searchParams.get("limit") || "";
    const all = searchParams.get("all") || "";

    if (all === "true") {
      const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
      const products = await Promise.all(
        result.rows.map(async (row) => {
          const photoPaths = JSON.parse(row.photo_paths || "[]");
          const boxesResult = await pool.query(
            "SELECT b.barcode, b.name " +
              "FROM box_items bi JOIN boxes b ON bi.box_id = b.id " +
              "WHERE bi.product_id = $1",
            [row.id]
          );
          const boxes = boxesResult.rows.map((box) => ({
            barcode: box.barcode,
            name: box.name,
          }));
          return {
            ...row,
            photo_paths: photoPaths,
            boxes,
          };
        })
      );
      return NextResponse.json(products);
    }

    // Filtering
    const whereClauses: string[] = [];
    const queryValues: any[] = [];

    if (search.trim()) {
      queryValues.push(`%${search.trim()}%`);
      const pIdx = queryValues.length;
      whereClauses.push(`(name ILIKE $${pIdx} OR barcode ILIKE $${pIdx} OR category ILIKE $${pIdx} OR description ILIKE $${pIdx})`);
    }

    if (category.trim()) {
      queryValues.push(category.trim());
      const pIdx = queryValues.length;
      whereClauses.push(`category = $${pIdx}`);
    }

    if (salesChannel.trim()) {
      queryValues.push(salesChannel.trim());
      const pIdx = queryValues.length;
      whereClauses.push(`$${pIdx} = ANY(sales_channels)`);
    }

    if (deliveryMethod.trim()) {
      queryValues.push(deliveryMethod.trim());
      const pIdx = queryValues.length;
      whereClauses.push(`$${pIdx} = ANY(delivery_methods)`);
    }

    if (noDelivery === "true") {
      whereClauses.push(`cardinality(delivery_methods) = 0`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Sorting
    const allowedSortFields = ["name", "quantity", "price", "created_at", "id"];
    const sortField = allowedSortFields.includes(sort) ? sort : "id";

    const allowedOrder = ["asc", "desc"];
    const sortOrder = allowedOrder.includes(order.toLowerCase()) ? order.toLowerCase() : "asc";

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Count total number
    const countQuery = `SELECT COUNT(*) as count FROM products ${whereStr}`;
    const countResult = await pool.query(countQuery, queryValues);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Request data with sorting and pagination
    const dataQuery = `SELECT * FROM products ${whereStr} ORDER BY ${sortField} ${sortOrder} LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}`;
    const dataResult = await pool.query(dataQuery, [...queryValues, limitNum, offset]);

    const products = await Promise.all(
      dataResult.rows.map(async (row) => {
        const photoPaths = JSON.parse(row.photo_paths || "[]");
        const boxesResult = await pool.query(
          "SELECT b.barcode, b.name " +
            "FROM box_items bi JOIN boxes b ON bi.box_id = b.id " +
            "WHERE bi.product_id = $1",
          [row.id]
        );
        const boxes = boxesResult.rows.map((box) => ({
          barcode: box.barcode,
          name: box.name,
        }));
        return {
          ...row,
          photo_paths: photoPaths,
          boxes,
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limitNum);

    return NextResponse.json({
      products,
      totalCount,
      page: pageNum,
      totalPages,
    });
  } catch (error) {
    console.error("Ошибка при получении списка товаров:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка товаров" },
      { status: 500 }
    );
  }
}
