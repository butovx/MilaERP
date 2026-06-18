import { Pool } from "pg";

if (
  !process.env.DB_USER ||
  !process.env.DB_HOST ||
  !process.env.DB_NAME ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_PORT
) {
  throw new Error("Необходимо настроить переменные окружения для базы данных");
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
});

export default pool;
