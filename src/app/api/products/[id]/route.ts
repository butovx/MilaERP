import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }
    const product = result.rows[0];
    product.photo_paths = JSON.parse(product.photo_paths || "[]");
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Ошибка при получении товара" }, { status: 500 });
  }
}
