const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { createCanvas } = require("canvas");
const JsBarcode = require("jsbarcode");
const fs = require("fs");
const multer = require("multer");
const pool = require("./db");
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Настройка multer для сохранения до 10 файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage }).array("photos", 10); // До 10 файлов с ключом 'photos'

// Генерация штрихкода EAN-13
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
app.post("/add-product", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка при загрузке файлов" });
    }
    const { name, quantity, description, price, category } = req.body;
    const photos = req.files;
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
      const photoPaths = photos ? photos.map((photo) => `/uploads/${photo.filename}`) : [];
      await pool.query(
        "INSERT INTO products (name, quantity, barcode, photo_paths, description, price, category) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [name, quantity, barcode, JSON.stringify(photoPaths), description, price, category]
      );
      res.status(201).json({ message: `Товар добавлен с артикулом: ${barcode}` });
    } catch (error) {
      console.error("Ошибка при добавлении товара:", error);
      res.status(500).json({ error: "Ошибка при добавлении товара" });
    }
  });
});

// Получение списка товаров
app.get("/get-products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    const products = result.rows.map((row) => ({
      ...row,
      photo_paths: JSON.parse(row.photo_paths || "[]"),
    }));
    res.status(200).json(products);
  } catch (error) {
    console.error("Ошибка при получении списка товаров:", error);
    res.status(500).json({ error: "Ошибка при получении списка товаров" });
  }
});

// Получение товара по штрихкоду
app.get("/product/:barcode", async (req, res) => {
  const { barcode } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE barcode = $1",
      [barcode]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }
    const product = result.rows[0];
    product.photo_paths = JSON.parse(product.photo_paths || "[]");
    res.status(200).json(product);
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    res.status(500).json({ error: "Ошибка при получении информации о товаре" });
  }
});

// Обновление товара
app.put("/update-product/:barcode", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка при загрузке файлов" });
    }
    const { barcode } = req.params;
    const { name, quantity, description, price, category } = req.body;
    const photos = req.files;

    try {
      const result = await pool.query(
        "SELECT photo_paths FROM products WHERE barcode = $1",
        [barcode]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Товар не найден" });
      }

      const currentPhotoPaths = JSON.parse(result.rows[0].photo_paths || "[]");
      let newPhotoPaths = photos.length > 0 ? photos.map((photo) => `/uploads/${photo.filename}`) : currentPhotoPaths;

      if (photos.length > 0) {
        currentPhotoPaths.forEach((photoPath) => {
          const fullPath = path.join(__dirname, "public", photoPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      }

      // Обработка пустых строк для quantity и price
      const parsedQuantity = quantity === "" || isNaN(parseInt(quantity)) ? null : parseInt(quantity);
      const parsedPrice = price === "" || isNaN(parseFloat(price)) ? null : parseFloat(price);

      await pool.query(
        "UPDATE products SET name = $1, quantity = $2, photo_paths = $3, description = $4, price = $5, category = $6 WHERE barcode = $7",
        [name, parsedQuantity, JSON.stringify(newPhotoPaths), description, parsedPrice, category, barcode]
      );

      res.status(200).json({ message: `Товар с артикулом ${barcode} обновлен` });
    } catch (error) {
      console.error("Ошибка при обновлении товара:", error);
      res.status(500).json({ error: "Ошибка при обновлении товара" });
    }
  });
});

// Удаление товара
app.delete("/delete-product/:barcode", async (req, res) => {
  const { barcode } = req.params;

  try {
    const result = await pool.query(
      "SELECT photo_paths FROM products WHERE barcode = $1",
      [barcode]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    const photoPaths = JSON.parse(result.rows[0].photo_paths || "[]");

    // Удаляем товар из базы данных
    await pool.query("DELETE FROM products WHERE barcode = $1", [barcode]);

    // Удаляем все связанные файлы изображений
    photoPaths.forEach((photoPath) => {
      const fullPath = path.join(__dirname, "public", photoPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    res.status(200).json({ message: `Товар с артикулом ${barcode} удален` });
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);
    res.status(500).json({ error: "Ошибка при удалении товара" });
  }
});

// Обновление коробки
app.put("/update-box/:barcode", async (req, res) => {
  const { barcode } = req.params;
  const { name, newBarcode } = req.body;

  try {
    const boxResult = await pool.query(
      "SELECT id FROM boxes WHERE barcode = $1",
      [barcode]
    );
    if (boxResult.rows.length === 0) {
      return res.status(404).json({ error: "Коробка не найдена" });
    }
    const boxId = boxResult.rows[0].id;

    if (newBarcode !== barcode) {
      const barcodeCheck = await pool.query(
        "SELECT * FROM boxes WHERE barcode = $1",
        [newBarcode]
      );
      if (barcodeCheck.rows.length > 0) {
        return res.status(400).json({ error: "Штрихкод уже используется" });
      }
    }

    await pool.query(
      "UPDATE boxes SET name = $1, barcode = $2 WHERE id = $3",
      [name, newBarcode, boxId]
    );

    res.status(200).json({ message: `Коробка с артикулом ${barcode} обновлена` });
  } catch (error) {
    console.error("Ошибка при обновлении коробки:", error);
    res.status(500).json({ error: "Ошибка при обновлении коробки" });
  }
});

// Удаление коробки
app.delete("/delete-box/:barcode", async (req, res) => {
  const { barcode } = req.params;
  const force = req.query.force === "true";

  try {
    const result = await pool.query("SELECT id FROM boxes WHERE barcode = $1", [
      barcode,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Коробка не найдена" });
    }

    const boxId = result.rows[0].id;

    const boxItemsResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1",
      [boxId]
    );

    if (boxItemsResult.rows.length > 0 && !force) {
      return res.status(400).json({
        error: "Коробка содержит товары. Используйте force=true для удаления.",
        hasItems: true,
      });
    }

    if (boxItemsResult.rows.length > 0) {
      await pool.query("DELETE FROM box_items WHERE box_id = $1", [boxId]);
    }

    await pool.query("DELETE FROM boxes WHERE barcode = $1", [barcode]);

    res.status(200).json({ message: `Коробка с артикулом ${barcode} удалена` });
  } catch (error) {
    console.error("Ошибка при удалении коробки:", error);
    res.status(500).json({ error: "Ошибка при удалении коробки" });
  }
});

// Удаление товара из коробки
app.delete("/delete-from-box/:boxBarcode/:productBarcode", async (req, res) => {
  const { boxBarcode, productBarcode } = req.params;

  try {
    const boxResult = await pool.query(
      "SELECT id FROM boxes WHERE barcode = $1",
      [boxBarcode]
    );
    if (boxResult.rows.length === 0) {
      return res.status(404).json({ error: "Коробка не найдена" });
    }
    const boxId = boxResult.rows[0].id;

    const productResult = await pool.query(
      "SELECT id FROM products WHERE barcode = $1",
      [productBarcode]
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }
    const productId = productResult.rows[0].id;

    const itemResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден в этой коробке" });
    }

    await pool.query(
      "DELETE FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    res.status(200).json({
      message: `Товар с артикулом ${productBarcode} удален из коробки ${boxBarcode}`,
    });
  } catch (error) {
    console.error("Ошибка при удалении товара из коробки:", error);
    res.status(500).json({ error: "Ошибка при удалении товара из коробки" });
  }
});

// Обновление количества товара в коробке
app.put("/update-box-item/:boxBarcode/:productBarcode", async (req, res) => {
  const { boxBarcode, productBarcode } = req.params;
  const { quantity } = req.body;

  try {
    const boxResult = await pool.query(
      "SELECT id FROM boxes WHERE barcode = $1",
      [boxBarcode]
    );
    if (boxResult.rows.length === 0) {
      return res.status(404).json({ error: "Коробка не найдена" });
    }
    const boxId = boxResult.rows[0].id;

    const productResult = await pool.query(
      "SELECT id FROM products WHERE barcode = $1",
      [productBarcode]
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }
    const productId = productResult.rows[0].id;

    const itemResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден в этой коробке" });
    }

    await pool.query(
      "UPDATE box_items SET quantity = $1 WHERE box_id = $2 AND product_id = $3",
      [quantity, boxId, productId]
    );

    res.status(200).json({
      message: `Количество товара ${productBarcode} в коробке ${boxBarcode} обновлено`,
    });
  } catch (error) {
    console.error("Ошибка при обновлении товара в коробке:", error);
    res.status(500).json({ error: "Ошибка при обновлении товара в коробке" });
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

// Получение списка коробок
app.get("/get-boxes", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, barcode, name FROM boxes");
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении списка коробок" });
  }
});

// Получение содержимого коробки
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

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});