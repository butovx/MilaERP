const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { createCanvas } = require("canvas");
const JsBarcode = require("jsbarcode");
const fs = require("fs");
const pool = require("./db");
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

function generateEAN13(prefix) {
  const random = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0");
  const code = prefix + random;
  const checkDigit = calculateEAN13CheckDigit(code);
  return code + checkDigit;
}

function calculateEAN13CheckDigit(code) {
  const digits = code.split("").map(Number);
  const sum = digits.reduce(
    (acc, digit, index) => acc + (index % 2 === 0 ? digit : digit * 3),
    0
  );
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

// Добавление товара
app.post("/add-product", async (req, res) => {
  const { name, quantity } = req.body;
  let barcode = generateEAN13("200");
  let isUnique = false;

  while (!isUnique) {
    const result = await pool.query(
      "SELECT * FROM products WHERE barcode = $1",
      [barcode]
    );
    if (result.rows.length === 0) isUnique = true;
    else barcode = generateEAN13("200");
  }

  try {
    await pool.query(
      "INSERT INTO products (name, quantity, barcode) VALUES ($1, $2, $3)",
      [name, quantity, barcode]
    );
    res.status(201).json({ message: `Товар добавлен с артикулом: ${barcode}` });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при добавлении товара" });
  }
});

// Список товаров
app.get("/get-products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении списка товаров" });
  }
});

// Генерация штрихкода
app.get("/barcode/:code", async (req, res) => {
  const { code } = req.params;

  if (!/^\d{13}$/.test(code)) {
    return res.status(400).json({ error: "Неверный формат штрихкода" });
  }

  try {
    const canvas = createCanvas(478, 212);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    JsBarcode(canvas, code, {
      format: "EAN13",
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 20,
      textMargin: 5,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
      textAlign: "center",
      textPosition: "bottom",
    });

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="barcode_${code}.png"`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Ошибка генерации штрихкода:", error);
    res.status(500).json({ error: "Ошибка при генерации штрихкода" });
  }
});

// Информация о товаре
app.get("/product/:barcode", async (req, res) => {
  const { barcode } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE barcode = $1",
      [barcode]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Товар не найден" });
    }
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Создание коробки
app.post("/create-box", async (req, res) => {
  const { name } = req.body;
  let barcode = generateEAN13("300");
  let isUnique = false;

  while (!isUnique) {
    const result = await pool.query("SELECT * FROM boxes WHERE barcode = $1", [
      barcode,
    ]);
    if (result.rows.length === 0) isUnique = true;
    else barcode = generateEAN13("300");
  }

  try {
    await pool.query("INSERT INTO boxes (barcode, name) VALUES ($1, $2)", [
      barcode,
      name || `Коробка ${barcode}`,
    ]);
    res
      .status(201)
      .json({ message: `Коробка создана с штрихкодом: ${barcode}` });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при создании коробки" });
  }
});

// Добавление товара в коробку
app.post("/add-to-box", async (req, res) => {
  const { boxBarcode, productBarcode, quantity } = req.body;

  try {
    const boxResult = await pool.query(
      "SELECT id FROM boxes WHERE barcode = $1",
      [boxBarcode]
    );
    if (boxResult.rows.length === 0)
      return res.status(404).json({ error: "Коробка не найдена" });
    const boxId = boxResult.rows[0].id;

    const productResult = await pool.query(
      "SELECT id FROM products WHERE barcode = $1",
      [productBarcode]
    );
    if (productResult.rows.length === 0)
      return res.status(404).json({ error: "Товар не найден" });
    const productId = productResult.rows[0].id;

    const existingItem = await pool.query(
      "SELECT quantity FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    if (existingItem.rows.length > 0) {
      await pool.query(
        "UPDATE box_items SET quantity = quantity + $1 WHERE box_id = $2 AND product_id = $3",
        [quantity, boxId, productId]
      );
    } else {
      await pool.query(
        "INSERT INTO box_items (box_id, product_id, quantity) VALUES ($1, $2, $3)",
        [boxId, productId, quantity]
      );
    }

    res.status(200).json({ message: "Товар добавлен в коробку" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при добавлении товара в коробку" });
  }
});

// Список коробок
app.get("/get-boxes", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, barcode, name FROM boxes");
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении списка коробок" });
  }
});

// Содержимое коробки
app.get("/box-content/:barcode", async (req, res) => {
  const { barcode } = req.params;

  try {
    const boxResult = await pool.query(
      "SELECT id, name FROM boxes WHERE barcode = $1",
      [barcode]
    );
    if (boxResult.rows.length === 0)
      return res.status(404).json({ error: "Коробка не найдена" });
    const boxId = boxResult.rows[0].id;
    const boxName = boxResult.rows[0].name;

    const contentResult = await pool.query(
      "SELECT p.id, p.name, p.barcode, bi.quantity FROM box_items bi JOIN products p ON bi.product_id = p.id WHERE bi.box_id = $1",
      [boxId]
    );

    res.status(200).json({ name: boxName, items: contentResult.rows });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении содержимого коробки" });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
