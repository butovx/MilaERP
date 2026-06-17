import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const result = await pool.query("SELECT * FROM boxes WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Коробка не найдена" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Ошибка при получении коробки" }, { status: 500 });
  }
}
