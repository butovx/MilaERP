const { Pool } = require("pg");

// Конфигурация подключения к базе данных
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "shop",
  password: "postgres",
  port: 5432,
});

module.exports = pool;
