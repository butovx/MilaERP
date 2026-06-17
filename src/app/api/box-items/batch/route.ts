import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Bulk add products to box
 * POST /api/box-items/batch
 * Body: { box_id: number, product_ids: number[], quantity: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { box_id, product_ids, quantity = 1 } = await request.json();

    // Input validation
    if (!box_id) {
      return NextResponse.json(
        { error: "Не указан ID коробки" },
        { status: 400 }
      );
    }

    if (
      !product_ids ||
      !Array.isArray(product_ids) ||
      product_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "Не указаны ID товаров" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Количество должно быть больше 0" },
        { status: 400 }
      );
    }

    // Check if the box exists
    const boxResult = await pool.query("SELECT id FROM boxes WHERE id = $1", [
      box_id,
    ]);

    if (boxResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    // Get products information
    const productIdsPlaceholder = product_ids
      .map((_, i) => `$${i + 1}`)
      .join(",");
    const productsResult = await pool.query(
      `SELECT id FROM products WHERE id IN (${productIdsPlaceholder})`,
      product_ids
    );

    if (productsResult.rows.length !== product_ids.length) {
      // Some products not found
      const foundIds = productsResult.rows.map((row) => row.id);
      const missingIds = product_ids.filter((id) => !foundIds.includes(id));

      return NextResponse.json(
        {
          error: "Некоторые товары не найдены",
          missingIds,
        },
        { status: 404 }
      );
    }

    // For each product, check if it is already in the box
    const results = [];

    for (const product_id of product_ids) {
      // Check if this product is already in the box
      const existingItemResult = await pool.query(
        "SELECT * FROM box_items WHERE box_id = $1 AND product_id = $2",
        [box_id, product_id]
      );

      if (existingItemResult.rows.length > 0) {
        // Update product quantity in the box
        const updatedItem = await pool.query(
          "UPDATE box_items SET quantity = $1 WHERE box_id = $2 AND product_id = $3 RETURNING *",
          [quantity, box_id, product_id]
        );

        results.push({
          product_id,
          action: "updated",
          item: updatedItem.rows[0],
        });
      } else {
        // Add product to the box
        const newItem = await pool.query(
          "INSERT INTO box_items (box_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
          [box_id, product_id, quantity]
        );

        results.push({
          product_id,
          action: "added",
          item: newItem.rows[0],
        });
      }
    }

    return NextResponse.json({
      message: `${results.length} товаров добавлено в коробку`,
      results,
    });
  } catch (error) {
    console.error("Ошибка при массовом добавлении товаров в коробку:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
