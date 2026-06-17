import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateEAN13 } from "@/utils/barcode";

// Get list of boxes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "";
    const order = searchParams.get("order") || "";
    const page = searchParams.get("page") || "";
    const limit = searchParams.get("limit") || "";
    const all = searchParams.get("all") || "";

    const fetchBoxesWithInfo = async (rows: any[]) => {
      return await Promise.all(
        rows.map(async (box) => {
          try {
            // Get count of products in the box
            const itemsCountResult = await pool.query(
              "SELECT COUNT(*) as count FROM box_items WHERE box_id = $1",
              [box.id]
            );
            const itemsCount = parseInt(
              itemsCountResult.rows[0]?.count || "0",
              10
            );

            // Get total price of products in the box
            const totalPriceResult = await pool.query(
              `
              SELECT COALESCE(SUM(p.price * bi.quantity), 0) as total
              FROM box_items bi
              LEFT JOIN products p ON bi.product_id = p.id
              WHERE bi.box_id = $1
            `,
              [box.id]
            );
            const totalPrice = parseFloat(totalPriceResult.rows[0]?.total || "0");

            return {
              ...box,
              items_count: itemsCount,
              total_price: totalPrice,
            };
          } catch (err) {
            console.error(
              `Ошибка при получении информации для коробки ${box.id}:`,
              err
            );
            return {
              ...box,
              items_count: 0,
              total_price: 0,
            };
          }
        })
      );
    };

    if (all === "true") {
      const boxesResult = await pool.query(
        "SELECT * FROM boxes ORDER BY id DESC"
      );
      const boxesWithInfo = await fetchBoxesWithInfo(boxesResult.rows);
      return NextResponse.json(boxesWithInfo);
    }

    // Filtering
    const whereClauses: string[] = [];
    const queryValues: any[] = [];

    if (search.trim()) {
      queryValues.push(`%${search.trim()}%`);
      const pIdx = queryValues.length;
      whereClauses.push(`(name ILIKE $${pIdx} OR barcode ILIKE $${pIdx})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Sorting
    const allowedSortFields = ["name", "id", "created_at"];
    const sortField = allowedSortFields.includes(sort) ? sort : "id";

    const allowedOrder = ["asc", "desc"];
    const sortOrder = allowedOrder.includes(order.toLowerCase()) ? order.toLowerCase() : "desc";

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Count total number
    const countQuery = `SELECT COUNT(*) as count FROM boxes ${whereStr}`;
    const countResult = await pool.query(countQuery, queryValues);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Request data
    const dataQuery = `SELECT * FROM boxes ${whereStr} ORDER BY ${sortField} ${sortOrder} LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}`;
    const dataResult = await pool.query(dataQuery, [...queryValues, limitNum, offset]);

    const boxesWithInfo = await fetchBoxesWithInfo(dataResult.rows);
    const totalPages = Math.ceil(totalCount / limitNum);

    return NextResponse.json({
      boxes: boxesWithInfo,
      totalCount,
      page: pageNum,
      totalPages,
    });
  } catch (error) {
    console.error("Ошибка при получении списка коробок:", error);
    if (error instanceof Error) {
      console.error("Сообщение ошибки:", error.message);
      console.error("Стек ошибки:", error.stack);
    }
    return NextResponse.json(
      { error: "Ошибка при получении списка коробок" },
      { status: 500 }
    );
  }
}

// Create new box
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Название коробки не может быть пустым" },
        { status: 400 }
      );
    }

    // Generate unique barcode
    let barcode = generateEAN13("300");
    let isUnique = false;

    while (!isUnique) {
      const result = await pool.query(
        "SELECT * FROM boxes WHERE barcode = $1",
        [barcode]
      );
      if (result.rows.length === 0) isUnique = true;
      else barcode = generateEAN13("300");
    }

    // Create the box
    const result = await pool.query(
      "INSERT INTO boxes (name, barcode) VALUES ($1, $2) RETURNING *",
      [name, barcode]
    );

    const newBox = result.rows[0];

    return NextResponse.json(
      {
        message: "Коробка успешно создана",
        barcode: newBox.barcode,
        box: newBox,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка при создании коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при создании коробки" },
      { status: 500 }
    );
  }
}
