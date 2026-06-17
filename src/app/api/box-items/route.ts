import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// POST /api/box-items - add product to box
export async function POST(request: NextRequest) {
  try {
    const { box_id, product_barcode, quantity } = await request.json();

    // Input validation
    if (!box_id) {
      return NextResponse.json(
        { error: "Не указан ID коробки" },
        { status: 400 }
      );
    }

    if (!product_barcode) {
      return NextResponse.json(
        { error: "Не указан штрихкод товара" },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
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

    // Get product by barcode
    const productResult = await pool.query(
      "SELECT id FROM products WHERE barcode = $1",
      [product_barcode]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const product_id = productResult.rows[0].id;

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

      return NextResponse.json({
        message: "Количество товара в коробке обновлено",
        item: updatedItem.rows[0],
      });
    } else {
      // Add product to the box
      const newItem = await pool.query(
        "INSERT INTO box_items (box_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
        [box_id, product_id, quantity]
      );

      return NextResponse.json({
        message: "Товар добавлен в коробку",
        item: newItem.rows[0],
      });
    }
  } catch (error) {
    console.error("Ошибка при добавлении товара в коробку:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
