// Глобальные переменные
const globalState = {
  stream: null,
  lastDetected: null,
  detectionCount: 0,
  allProducts: [],
};

// Утилиты
const utils = {
  fetchData: async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Ошибка запроса");
    }
    return response.status === 201 || response.status === 200
      ? data.message || data
      : data;
  },
  populateTable: (tbody, data, errorDiv) => {
    tbody.innerHTML = "";
    if (data.length === 0) {
      errorDiv.style.display = "block";
      errorDiv.textContent = "Товары не найдены";
      return;
    }
    errorDiv.style.display = "none";
    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>
                    ${item.barcode} 
                    <a href="/barcode/${item.barcode}" download="barcode_${item.barcode}.png" class="download-btn">
                        <i class="fas fa-download"></i>
                    </a>
                </td>
            `;
      tbody.appendChild(row);
    });
  },
  populateBoxesTable: (tbody, data, errorDiv) => {
    tbody.innerHTML = "";
    if (data.length === 0) {
      errorDiv.style.display = "block";
      errorDiv.textContent = "Коробки не найдены";
      return;
    }
    errorDiv.style.display = "none";
    data.forEach((box) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${box.name}</td>
                <td>${box.barcode} <a href="/barcode/${box.barcode}" download="barcode_${box.barcode}.png" class="download-btn"><i class="fas fa-download"></i></a></td>
                <td><a href="/box-content.html?barcode=${box.barcode}"><i class="fas fa-eye"></i> Просмотр</a></td>
            `;
      tbody.appendChild(row);
    });
  },
  populateSelect: (select, data, valueKey, displayKey) => {
    select.innerHTML = '<option value="">Выберите</option>';
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[displayKey];
      select.appendChild(option);
    });
  },
  showMessage: (element, message, type) => {
    element.style.display = "block";
    element.className = type;
    element.textContent = message;
  },
  downloadPNG: (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Модули
const indexModule = {
  init: () => {
    const form = document.getElementById("productForm");
    const resultDiv = document.getElementById("result");
    if (!form || !resultDiv) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const quantity = parseInt(document.getElementById("quantity").value);
      resultDiv.style.display = "none";
      resultDiv.classList.remove("success", "error");
      try {
        const message = await utils.fetchData("/add-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, quantity }),
        });
        utils.showMessage(resultDiv, message, "success");
      } catch (error) {
        utils.showMessage(resultDiv, error.message, "error");
      }
    });
  },
};

const productsModule = {
  init: () => {
    const productsListBody = document.querySelector("#productsList tbody");
    const listErrorDiv = document.getElementById("listError");
    if (!productsListBody || !listErrorDiv) return;

    async function loadProducts() {
      try {
        const products = await utils.fetchData("/get-products");
        utils.populateTable(productsListBody, products, listErrorDiv);
      } catch (error) {
        utils.showMessage(listErrorDiv, error.message, "error");
      }
    }
    loadProducts();
  },
};

const scanModule = {
  init: () => {
    const video = document.getElementById("video");
    const scannedBarcode = document.getElementById("scanned-barcode");
    const restartButton = document.getElementById("restart");
    const productInfo = document.getElementById("product-info");
    const errorDiv = document.getElementById("error");
    if (
      !video ||
      !scannedBarcode ||
      !restartButton ||
      !productInfo ||
      !errorDiv
    )
      return;

    function startScanner() {
      errorDiv.style.display = "none";
      restartButton.style.display = "none";
      productInfo.style.display = "none";
      scannedBarcode.textContent = "";
      globalState.lastDetected = null;
      globalState.detectionCount = 0;

      if (!navigator.mediaDevices?.getUserMedia) {
        utils.showMessage(
          errorDiv,
          "Ваш браузер не поддерживает камеру",
          "error"
        );
        restartButton.style.display = "block";
        return;
      }

      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          globalState.stream = stream;
          video.srcObject = stream;
          video.play();
          Quagga.init(
            {
              inputStream: { type: "LiveStream", target: video },
              decoder: { readers: ["ean_reader"] },
            },
            (err) => {
              if (err)
                return utils.showMessage(
                  errorDiv,
                  `Ошибка Quagga: ${err}`,
                  "error"
                );
              Quagga.start();
            }
          );
          Quagga.onDetected(async (data) => {
            const barcode = data.codeResult.code;
            scannedBarcode.textContent = `Штрихкод: ${barcode}`;
            if (globalState.lastDetected === barcode)
              globalState.detectionCount++;
            else {
              globalState.lastDetected = barcode;
              globalState.detectionCount = 1;
            }
            if (globalState.detectionCount >= 3) {
              Quagga.stop();
              globalState.stream.getTracks().forEach((track) => track.stop());
              try {
                const result = await utils.fetchData(`/product/${barcode}`);
                productInfo.innerHTML = `
                                    <h2>Найден товар</h2>
                                    <p><strong>ID:</strong> ${result.id}</p>
                                    <p><strong>Название:</strong> ${result.name}</p>
                                    <p><strong>Количество:</strong> ${result.quantity}</p>
                                    <p><strong>Штрихкод:</strong> <a href="/barcode/${result.barcode}" target="_blank">${result.barcode}</a></p>
                                `;
                productInfo.style.display = "block";
              } catch (error) {
                if (barcode.startsWith("300")) {
                  window.location.href = `/box-content.html?barcode=${barcode}`;
                } else {
                  utils.showMessage(errorDiv, error.message, "error");
                }
              }
              restartButton.style.display = "block";
            }
          });
        })
        .catch((err) =>
          utils.showMessage(errorDiv, `Ошибка камеры: ${err}`, "error")
        );
    }

    startScanner();
    restartButton.addEventListener("click", startScanner);
  },
};

const boxesModule = {
  init: () => {
    const createBoxForm = document.getElementById("createBoxForm");
    const resultDiv = document.getElementById("result");
    const addToBoxForm = document.getElementById("addToBoxForm");
    const addResultDiv = document.getElementById("addResult");
    const boxesList = document.getElementById("boxesList");
    const listErrorDiv = document.getElementById("listError");
    const boxBarcodeSelect = document.getElementById("boxBarcode");
    const productBarcodeSelect = document.getElementById("productBarcode");

    if (
      !createBoxForm ||
      !resultDiv ||
      !addToBoxForm ||
      !addResultDiv ||
      !boxesList ||
      !listErrorDiv ||
      !boxBarcodeSelect ||
      !productBarcodeSelect
    )
      return;

    // Загрузка данных для селектов
    async function loadSelectData() {
      try {
        const boxes = await utils.fetchData("/get-boxes");
        const products = await utils.fetchData("/get-products");
        utils.populateSelect(boxBarcodeSelect, boxes, "barcode", "name");
        utils.populateSelect(productBarcodeSelect, products, "barcode", "name");
      } catch (error) {
        utils.showMessage(listErrorDiv, error.message, "error");
      }
    }

    createBoxForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("boxName").value;
      resultDiv.style.display = "none";
      resultDiv.classList.remove("success", "error");
      try {
        const message = await utils.fetchData("/create-box", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        utils.showMessage(resultDiv, message, "success");
        loadBoxes();
        loadSelectData(); // Обновляем список коробок после создания
      } catch (error) {
        utils.showMessage(resultDiv, error.message, "error");
      }
    });

    addToBoxForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const boxBarcode = boxBarcodeSelect.value;
      const productBarcode = productBarcodeSelect.value;
      const quantity = parseInt(document.getElementById("quantity").value);
      addResultDiv.style.display = "none";
      addResultDiv.classList.remove("success", "error");
      if (!boxBarcode || !productBarcode) {
        utils.showMessage(addResultDiv, "Выберите коробку и товар", "error");
        return;
      }
      try {
        const message = await utils.fetchData("/add-to-box", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boxBarcode, productBarcode, quantity }),
        });
        utils.showMessage(addResultDiv, message, "success");
      } catch (error) {
        utils.showMessage(addResultDiv, error.message, "error");
      }
    });

    async function loadBoxes() {
      try {
        const boxes = await utils.fetchData("/get-boxes");
        utils.populateBoxesTable(boxesList, boxes, listErrorDiv);
      } catch (error) {
        utils.showMessage(listErrorDiv, error.message, "error");
      }
    }

    // Инициализация
    loadBoxes();
    loadSelectData();
  },
};

const boxContentModule = {
  init: () => {
    const boxContentBody = document.getElementById("boxContentBody");
    const errorDiv = document.getElementById("error");
    const boxNameElement = document.getElementById("boxName");
    const barcode = new URLSearchParams(window.location.search).get("barcode");

    if (!barcode)
      return utils.showMessage(errorDiv, "Штрихкод не указан", "error");

    async function loadBoxContent() {
      try {
        const data = await utils.fetchData(`/box-content/${barcode}`);
        boxNameElement.textContent = `Содержимое коробки: ${data.name}`;
        utils.populateTable(boxContentBody, data.items, errorDiv);
      } catch (error) {
        utils.showMessage(errorDiv, error.message, "error");
      }
    }
    loadBoxContent();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const path = document.location.pathname;
  if (path === "/index.html") indexModule.init();
  else if (path === "/products.html") productsModule.init();
  else if (path === "/scan.html") scanModule.init();
  else if (path === "/boxes.html") boxesModule.init();
  else if (path === "/box-content.html") boxContentModule.init();
});
