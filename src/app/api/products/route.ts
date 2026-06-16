import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    const products = result.rows.map(row => ({
      ...row,
      photo_paths: JSON.parse(row.photo_paths || "[]"),
      boxes: []
    }));
    return NextResponse.json(products);
  } catch (error) {
    console.error("Ошибка при получении списка товаров:", error);
    return NextResponse.json({ error: "Ошибка при получении списка товаров" }, { status: 500 });
  }
}
