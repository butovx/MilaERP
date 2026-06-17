import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface Params {
  params: Promise<{
    boxId: string;
    productId: string;
  }>;
}

// PUT /api/box-items/[boxId]/[productId] - update quantity of product in box
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const boxId = (await params).boxId;
    const productId = (await params).productId;
    const { quantity } = await request.json();

    // Input validation
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Количество должно быть больше 0" },
        { status: 400 }
      );
    }

    // Check if the record exists
    const existingItemResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    if (existingItemResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Товар не найден в этой коробке" },
        { status: 404 }
      );
    }

    // Update product quantity
    const updatedItem = await pool.query(
      "UPDATE box_items SET quantity = $1 WHERE box_id = $2 AND product_id = $3 RETURNING *",
      [quantity, boxId, productId]
    );

    return NextResponse.json({
      message: "Количество товара обновлено",
      item: updatedItem.rows[0],
    });
  } catch (error) {
    console.error("Ошибка при обновлении количества товара:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/box-items/[boxId]/[productId] - delete product from box
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const boxId = (await params).boxId;
    const productId = (await params).productId;

    // Check if the record exists
    const existingItemResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    if (existingItemResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Товар не найден в этой коробке" },
        { status: 404 }
      );
    }

    // Delete product from box
    await pool.query(
      "DELETE FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    return NextResponse.json({
      message: "Товар убран из коробки",
    });
  } catch (error) {
    console.error("Ошибка при удалении товара из коробки:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
