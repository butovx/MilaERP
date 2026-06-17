import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query("SELECT * FROM box_items");
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
