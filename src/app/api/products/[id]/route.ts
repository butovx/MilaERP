import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { uploadFiles } from "@/lib/upload";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// Get product information by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;

    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const product = result.rows[0];
    product.photo_paths = JSON.parse(product.photo_paths || "[]");

    // Get information about boxes containing the product
    const boxesResult = await pool.query(
      "SELECT b.id, b.barcode, b.name " +
        "FROM box_items bi JOIN boxes b ON bi.box_id = b.id " +
        "WHERE bi.product_id = $1",
      [id]
    );

    product.boxes = boxesResult.rows;

    return NextResponse.json(product);
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    return NextResponse.json(
      { error: "Ошибка при получении товара" },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const quantity = formData.get("quantity") as string;
    const description = (formData.get("description") as string) || null;
    const price = (formData.get("price") as string) || null;
    const category = (formData.get("category") as string) || null;
    const salesChannelsRaw = formData.get("sales_channels") as string;
    const salesChannels = salesChannelsRaw ? JSON.parse(salesChannelsRaw) : [];
    const deliveryMethodsRaw = formData.get("delivery_methods") as string;
    const deliveryMethods: string[] = deliveryMethodsRaw ? JSON.parse(deliveryMethodsRaw) : [];

    // Auto-map sales channels to delivery methods
    if (salesChannels.includes("ozon") && !deliveryMethods.includes("ozon")) {
      deliveryMethods.push("ozon");
    }
    if (salesChannels.includes("wildberries") && !deliveryMethods.includes("wb")) {
      deliveryMethods.push("wb");
    }
    if (salesChannels.includes("yandex_market") && !deliveryMethods.includes("yandex")) {
      deliveryMethods.push("yandex");
    }

    // Check if the product exists
    const checkResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    // File processing
    const files: File[] = [];
    const photoEntries = formData.getAll("photos");

    for (const photoEntry of photoEntries) {
      if (photoEntry instanceof File && photoEntry.size > 0) {
        files.push(photoEntry);
      }
    }

    // Get current photos
    const currentProduct = checkResult.rows[0];
    let photoPaths = JSON.parse(currentProduct.photo_paths || "[]");

    // If there are new photos, upload them and add to the existing ones
    if (files.length > 0) {
      const newPhotoPaths = await uploadFiles(files);
      photoPaths = [...photoPaths, ...newPhotoPaths];
    }

    // Update product in the database
    await pool.query(
      `UPDATE products SET 
       name = $1, 
       quantity = $2, 
       photo_paths = $3, 
       description = $4, 
       price = $5, 
       category = $6,
       sales_channels = $7,
       delivery_methods = $8
       WHERE id = $9`,
      [
        name,
        quantity ? parseInt(quantity, 10) : null,
        JSON.stringify(photoPaths),
        description,
        price ? parseFloat(price) : null,
        category,
        salesChannels,
        deliveryMethods,
        id,
      ]
    );

    return NextResponse.json({
      message: "Товар успешно обновлен",
    });
  } catch (error) {
    console.error("Ошибка при обновлении товара:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении товара" },
      { status: 500 }
    );
  }
}

// Delete product
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;

    // Get product information to know which files to delete
    const productResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const product = productResult.rows[0];
    const photoPaths = JSON.parse(product.photo_paths || "[]");

    // Check if the product is in boxes
    const boxItemsResult = await pool.query(
      "SELECT * FROM box_items WHERE product_id = $1",
      [id]
    );

    if (boxItemsResult.rows.length > 0) {
      // Remove product from all boxes
      await pool.query("DELETE FROM box_items WHERE product_id = $1", [id]);
    }

    // Delete the product
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    // Delete image files
    const { deleteFile } = await import("@/lib/upload");
    const deletionPromises = photoPaths.map((path: string) => deleteFile(path));
    await Promise.all(deletionPromises);

    return NextResponse.json({
      message: "Товар успешно удален",
    });
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении товара" },
      { status: 500 }
    );
  }
}
