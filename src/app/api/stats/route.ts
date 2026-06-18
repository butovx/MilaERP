import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // 1. Total unique products (SKUs)
    const productsCountRes = await pool.query("SELECT COUNT(*) as count FROM products");
    const productsCount = parseInt(productsCountRes.rows[0].count, 10);

    // 2. Total physical units in stock
    const totalQuantityRes = await pool.query("SELECT COALESCE(SUM(quantity), 0) as total FROM products");
    const totalQuantity = parseInt(totalQuantityRes.rows[0].total, 10);

    // 3. Total warehouse value (price * quantity)
    const totalValueRes = await pool.query("SELECT COALESCE(SUM(price * quantity), 0) as total FROM products");
    const totalValue = parseFloat(totalValueRes.rows[0].total);

    // 4. Total number of boxes
    const boxesCountRes = await pool.query("SELECT COUNT(*) as count FROM boxes");
    const boxesCount = parseInt(boxesCountRes.rows[0].count, 10);

    // 5. Total physical items inside boxes
    const boxItemsCountRes = await pool.query("SELECT COALESCE(SUM(quantity), 0) as total FROM box_items");
    const boxItemsCount = parseInt(boxItemsCountRes.rows[0].total, 10);

    return NextResponse.json({
      productsCount,
      totalQuantity,
      totalValue,
      boxesCount,
      boxItemsCount,
    });
  } catch (error) {
    console.error("Ошибка при получении статистики склада:", error);
    return NextResponse.json(
      { error: "Не удалось получить статистику склада" },
      { status: 500 }
    );
  }
}
