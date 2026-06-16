import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface Params {
  params: Promise<{
    code: string;
  }>;
}

// Get product information by barcode
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const code = (await params).code;

    if (!code || code.length !== 13) {
      return NextResponse.json(
        { error: "Неверный формат штрихкода. Должен быть EAN13 (13 цифр)" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT * FROM products WHERE barcode = $1",
      [code]
    );

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
      [product.id]
    );

    product.boxes = boxesResult.rows;

    return NextResponse.json(product);
  } catch (error) {
    console.error("Ошибка при получении товара по штрихкоду:", error);
    return NextResponse.json(
      { error: "Ошибка при получении товара" },
      { status: 500 }
    );
  }
}
