import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Не указан поисковый запрос" },
      { status: 400 }
    );
  }

  try {
    const products = await pool.query(
      `SELECT id, name, barcode, quantity, price, category
       FROM products
       WHERE 
         LOWER(name) LIKE LOWER($1) OR
         barcode LIKE $1
       ORDER BY name
       LIMIT 10`,
      [`%${query}%`]
    );

    return NextResponse.json(products.rows);
  } catch (error) {
    console.error("Ошибка при поиске товаров:", error);
    return NextResponse.json(
      { error: "Ошибка при поиске товаров" },
      { status: 500 }
    );
  }
}
