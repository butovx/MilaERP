import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// Get box information by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;

    const result = await pool.query("SELECT * FROM boxes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    const box = result.rows[0];

    // Get box contents
    const itemsResult = await pool.query(
      `SELECT bi.*, p.name, p.barcode, p.photo_paths, p.description, p.price, p.category 
       FROM box_items bi 
       JOIN products p ON bi.product_id = p.id 
       WHERE bi.box_id = $1`,
      [id]
    );

    const items = itemsResult.rows.map((row) => {
      return {
        ...row,
        photo_paths: JSON.parse(row.photo_paths || "[]"),
      };
    });

    box.items = items;

    return NextResponse.json(box);
  } catch (error) {
    console.error("Ошибка при получении коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при получении коробки" },
      { status: 500 }
    );
  }
}

// Update box
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;
    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Название коробки не может быть пустым" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "UPDATE boxes SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Коробка успешно обновлена",
      box: result.rows[0],
    });
  } catch (error) {
    console.error("Ошибка при обновлении коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении коробки" },
      { status: 500 }
    );
  }
}

// Delete box
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;

    // Check if there are products in the box
    const boxItemsResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1",
      [id]
    );

    if (boxItemsResult.rows.length > 0) {
      // Delete all products from the box
      await pool.query("DELETE FROM box_items WHERE box_id = $1", [id]);
    }

    // Delete the box
    const result = await pool.query(
      "DELETE FROM boxes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Коробка успешно удалена",
    });
  } catch (error) {
    console.error("Ошибка при удалении коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении коробки" },
      { status: 500 }
    );
  }
}
