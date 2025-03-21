const globalState = {
  stream: null,
  lastDetected: null,
  detectionCount: 0,
  allProducts: [],
};

const utils = {
  // Fetch data from the server with support for progress tracking
  fetchData: async (url, options = {}, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || "GET", url, true);
      xhr.onload = () => {
        let data;
        try {
          data = JSON.parse(xhr.responseText); // Parse server response as JSON
        } catch (e) {
          reject(new Error("Invalid JSON response from server"));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data.message || data); // Return message or full data
        } else {
          reject(new Error(data.error || "Ошибка запроса"));
        }
      };
      xhr.onerror = () => reject(new Error("Ошибка сети"));
      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = onProgress; // Track upload progress (e.g., for file uploads)
      }
      if (options.body instanceof FormData) {
        // Handle FormData (e.g., file uploads)
        xhr.send(options.body);
      } else if (options.body) {
        // Handle JSON requests
        let body = options.body;
        // Fix for potential double-stringified input
        if (typeof body === "string") {
          try {
            body = JSON.parse(body); // Parse if accidentally stringified already
          } catch (e) {
            console.error("Invalid JSON string in body:", body);
            reject(new Error("Invalid JSON in request body"));
            return;
          }
        }
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(body));
      } else {
        // No body (e.g., GET requests)
        xhr.send();
      }
    });
  },

  // Populate a product table with edit/delete buttons
  populateTable: (tbody, products, errorDiv) => {
    tbody.innerHTML = ""; // Clear existing rows
    if (!products || products.length === 0) {
      utils.showMessage(errorDiv, "Товары не найдены", "error");
      return;
    }
    products.forEach((product) => {
      const row = document.createElement("tr");
      const boxInfo = product.boxes.length > 0
        ? product.boxes.map(box => `<a href="/box-content.html?barcode=${box.barcode}">${box.name}</a>`).join(", ")
        : "Не в коробке";
      row.innerHTML = `
        <td>${product.id}</td>
        <td>${
          product.photo_paths && product.photo_paths.length > 0
            ? `<img src="${product.photo_paths[0]}" alt="${product.name}" style="max-width: 50px; max-height: 50px;">`
            : "-"
        }</td>
        <td><a href="/product.html?barcode=${product.barcode}">${product.name}</a></td>
        <td>${product.quantity}</td>
        <td>${product.price ? product.price + " ₽" : "-"}</td>
        <td>${product.category || "-"}</td>
        <td>${product.barcode}</td>
        <td>${boxInfo}</td>
        <td>
          <button class="edit-btn" data-barcode="${product.barcode}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" data-barcode="${product.barcode}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Attach delete button event listeners
    tbody.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.stopPropagation();
        const barcode = button.getAttribute("data-barcode");
        if (confirm(`Вы уверены, что хотите удалить товар с артикулом ${barcode}?`)) {
          try {
            const message = await utils.fetchData(`/delete-product/${barcode}`, {
              method: "DELETE",
            });
            utils.showMessage(errorDiv, message, "success");
            productsModule.loadProducts();
          } catch (error) {
            if (error.message.includes("Товар находится в коробках")) {
              if (
                confirm(
                  "Товар находится в коробках. Удалить его вместе с записями в коробках?"
                )
              ) {
                try {
                  const message = await utils.fetchData(
                    `/delete-product/${barcode}?force=true`,
                    { method: "DELETE" }
                  );
                  utils.showMessage(errorDiv, message, "success");
                  productsModule.loadProducts();
                } catch (forceError) {
                  utils.showMessage(errorDiv, forceError.message, "error");
                }
              }
            } else {
              utils.showMessage(errorDiv, error.message, "error");
            }
          }
        }
      });
    });
  },

  // Populate a boxes table with view/edit/delete buttons
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
        <td><a href="#" class="clickable-barcode" data-barcode="${box.barcode}">${box.barcode}</a></td>
        <td>${box.name}</td>
        <td>
          <a href="/box-content.html?barcode=${box.barcode}" class="view-btn">
            <i class="fas fa-eye"></i> Просмотр
          </a>
          <button class="edit-btn" data-barcode="${box.barcode}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" data-barcode="${box.barcode}">
            <i class="fas fa-trash"></i>
          </button>
          <a href="/barcode/${box.barcode}" download="barcode_${box.barcode}.png" class="download-btn">
            <i class="fas fa-download"></i>
          </a>
        </td>
      `;
      tbody.appendChild(row);
    });
  
    // Добавляем обработчик для кликабельных штрихкодов
    tbody.querySelectorAll(".clickable-barcode").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const barcode = link.getAttribute("data-barcode");
        utils.downloadPNG(`/barcode/${barcode}`, `barcode_${barcode}.png`);
      });
    });
  
    // Delete button event listeners
    tbody.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const barcode = button.getAttribute("data-barcode");
        if (confirm(`Вы уверены, что хотите удалить коробку с артикулом ${barcode}?`)) {
          try {
            const message = await utils.fetchData(`/delete-box/${barcode}`, {
              method: "DELETE",
            });
            utils.showMessage(errorDiv, message, "success");
            boxesModule.loadBoxes();
          } catch (error) {
            if (error.message.includes("Коробка содержит товары")) {
              if (
                confirm(
                  "Коробка содержит товары. Удалить её вместе с содержимым?"
                )
              ) {
                try {
                  const message = await utils.fetchData(
                    `/delete-box/${barcode}?force=true`,
                    { method: "DELETE" }
                  );
                  utils.showMessage(errorDiv, message, "success");
                  boxesModule.loadBoxes();
                } catch (forceError) {
                  utils.showMessage(errorDiv, forceError.message, "error");
                }
              }
            } else {
              utils.showMessage(errorDiv, error.message, "error");
            }
          }
        }
      });
    });
  
    // Edit button handling (modal setup)
    const modal = document.getElementById("editBoxModal");
    const closeBtn = modal?.querySelector(".close");
    const editForm = document.getElementById("editBoxForm");
    const editResult = document.getElementById("editBoxResult");
  
    if (!modal || !closeBtn || !editForm || !editResult) {
      console.error("Модальное окно или его элементы не найдены");
      return;
    }
  
    tbody.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const barcode = button.getAttribute("data-barcode");
        try {
          const boxes = await utils.fetchData("/get-boxes");
          const box = boxes.find((b) => b.barcode === barcode);
          if (!box) throw new Error("Коробка не найдена в данных");
          document.getElementById("editBoxName").value = box.name;
          document.getElementById("editBoxBarcode").value = box.barcode;
          modal.style.display = "block";
  
          editForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById("editBoxName").value;
            const newBarcode = document.getElementById("editBoxBarcode").value;
            try {
              const message = await utils.fetchData(`/update-box/${barcode}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, newBarcode }),
              });
              utils.showMessage(editResult, message, "success");
              modal.style.display = "none";
              boxesModule.loadBoxes();
            } catch (error) {
              utils.showMessage(editResult, error.message, "error");
            }
          };
        } catch (error) {
          utils.showMessage(errorDiv, error.message, "error");
        }
      });
    });
  
    closeBtn.onclick = () => (modal.style.display = "none");
    window.onclick = (event) => {
      if (event.target === modal) modal.style.display = "none";
    };
  },
  // Populate a <select> element with options
  populateSelect: (select, data, valueKey, displayKey) => {
    select.innerHTML = '<option value="">Выберите</option>';
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[displayKey];
      select.appendChild(option);
    });
  },

  // Show a styled message in an element
  showMessage: (element, message, type) => {
    element.style.display = "block";
    element.className = type; // e.g., "success" or "error"
    element.textContent = message;
  },

  // Download a file as PNG
  downloadPNG: (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

const indexModule = {
  init: () => {
    const form = document.getElementById("productForm");
    const resultDiv = document.getElementById("result");
    const photoInput = document.getElementById("photos"); // Изменено на 'photos'
    if (!form || !resultDiv || !photoInput) return;

    let isUploading = false;
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.style.display = "none";
    spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    photoInput.parentNode.insertBefore(spinner, photoInput.nextSibling);

    const progressBarContainer = document.createElement("div");
    progressBarContainer.className = "progress-container";
    progressBarContainer.style.display = "none";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBarContainer.appendChild(progressBar);
    photoInput.parentNode.insertBefore(progressBarContainer, photoInput.nextSibling);

    photoInput.addEventListener("change", () => {
      if (photoInput.files.length > 0) {
        isUploading = true;
        spinner.style.display = "inline-block";
        progressBarContainer.style.display = "block";
        progressBar.style.width = "0%";
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const quantity = parseInt(document.getElementById("quantity").value);
      const description = document.getElementById("description").value;
      const price = document.getElementById("price").value;
      const category = document.getElementById("category").value;
      const photos = photoInput.files;
      resultDiv.style.display = "none";
      resultDiv.classList.remove("success", "error");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("quantity", quantity);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      for (let i = 0; i < photos.length; i++) {
        formData.append("photos", photos[i]);
      }

      try {
        const message = await utils.fetchData(
          "/add-product",
          {
            method: "POST",
            body: formData,
          },
          (event) => {
            if (event.lengthComputable) {
              const percent = (event.loaded / event.total) * 100;
              progressBar.style.width = `${percent}%`;
              if (percent === 100) {
                isUploading = false;
                spinner.style.display = "none";
                progressBarContainer.style.display = "none";
              }
            }
          }
        );
        utils.showMessage(resultDiv, message, "success");
        form.reset();
      } catch (error) {
        utils.showMessage(resultDiv, error.message, "error");
        spinner.style.display = "none";
        progressBarContainer.style.display = "none";
      }
    });
  },
};

const productsModule = {
  init: () => {
    const productsListBody = document.querySelector("#productsList tbody");
    const listErrorDiv = document.getElementById("listError");
    if (!productsListBody || !listErrorDiv) return;

    let currentBarcode = null;

    productsModule.loadProducts = async function () {
      try {
        const products = await utils.fetchData("/get-products");
        utils.populateTable(productsListBody, products, listErrorDiv);
      } catch (error) {
        utils.showMessage(listErrorDiv, error.message, "error");
      }
    };

    productsModule.loadProducts();

    const modal = document.getElementById("editModal");
    const closeBtn = modal?.querySelector(".close");
    const editForm = document.getElementById("editProductForm");
    const editResult = document.getElementById("editResult");
    const photoInput = document.getElementById("editPhotos");

    if (!modal || !closeBtn || !editForm || !editResult || !photoInput) return;

    let isUploading = false;
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.style.display = "none";
    spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    photoInput.parentNode.insertBefore(spinner, photoInput.nextSibling);

    const progressBarContainer = document.createElement("div");
    progressBarContainer.className = "progress-container";
    progressBarContainer.style.display = "none";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBarContainer.appendChild(progressBar);
    photoInput.parentNode.insertBefore(progressBarContainer, photoInput.nextSibling);

    photoInput.addEventListener("change", () => {
      if (photoInput.files.length > 0) {
        isUploading = true;
        spinner.style.display = "inline-block";
        progressBarContainer.style.display = "block";
        progressBar.style.width = "0%";
      }
    });

    productsListBody.addEventListener("click", async (e) => {
      if (e.target.closest(".edit-btn")) {
        e.stopPropagation();
        const button = e.target.closest(".edit-btn");
        currentBarcode = button.getAttribute("data-barcode");
        try {
          const product = await utils.fetchData(`/product/${currentBarcode}`);
          document.getElementById("editName").value = product.name;
          document.getElementById("editQuantity").value = product.quantity;
          document.getElementById("editDescription").value = product.description || "";
          document.getElementById("editPrice").value = product.price || "";
          document.getElementById("editCategory").value = product.category || "";
          const currentPhoto = document.getElementById("currentPhoto");
          if (product.photo_paths.length > 0) {
            currentPhoto.src = product.photo_paths[0];
            currentPhoto.style.display = "block";
          } else {
            currentPhoto.style.display = "none";
          }
          photoInput.value = "";
          modal.style.display = "block";
        } catch (error) {
          utils.showMessage(listErrorDiv, error.message, "error");
        }
      }
    });

    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentBarcode) {
        utils.showMessage(editResult, "Ошибка: штрихкод не определён", "error");
        return;
      }

      const name = document.getElementById("editName").value;
      const quantity = document.getElementById("editQuantity").value;
      const description = document.getElementById("editDescription").value;
      const price = document.getElementById("editPrice").value;
      const category = document.getElementById("editCategory").value;
      const photos = photoInput.files;

      if (!name) {
        utils.showMessage(editResult, "Название обязательно", "error");
        return;
      }
      if (quantity === "" || isNaN(parseInt(quantity))) {
        utils.showMessage(editResult, "Введите корректное количество", "error");
        return;
      }
      if (price !== "" && isNaN(parseFloat(price))) {
        utils.showMessage(editResult, "Введите корректную цену", "error");
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("quantity", parseInt(quantity));
      formData.append("description", description || "");
      formData.append("price", price === "" ? "" : parseFloat(price));
      formData.append("category", category || "");
      for (let i = 0; i < photos.length; i++) {
        formData.append("photos", photos[i]);
      }

      try {
        const message = await utils.fetchData(
          `/update-product/${currentBarcode}`,
          {
            method: "PUT",
            body: formData,
          },
          (event) => {
            if (event.lengthComputable) {
              const percent = (event.loaded / event.total) * 100;
              progressBar.style.width = `${percent}%`;
              if (percent === 100) {
                isUploading = false;
                spinner.style.display = "none";
                progressBarContainer.style.display = "none";
              }
            }
          }
        );
        utils.showMessage(editResult, message, "success");
        modal.style.display = "none";
        productsModule.loadProducts();
      } catch (error) {
        utils.showMessage(editResult, error.message, "error");
        spinner.style.display = "none";
        progressBarContainer.style.display = "none";
      }
    });

    closeBtn.onclick = () => (modal.style.display = "none");
    window.onclick = (event) => {
      if (event.target == modal) modal.style.display = "none";
    };
  },
  loadProducts: null,
};

const scanModule = {
  init: () => {
    // Элементы DOM
    const video = document.getElementById("video");
    const scannedBarcode = document.getElementById("scanned-barcode");
    const restartButton = document.getElementById("restart");
    const productInfo = document.getElementById("product-info");
    const errorDiv = document.getElementById("error");
    const manualBarcodeForm = document.getElementById("manualBarcodeForm");
    const manualBarcodeInput = document.getElementById("manualBarcode");
    const overlay = document.getElementById("overlay");
    const scanLog = document.getElementById("scan-log");

    // Проверка наличия всех элементов
    if (
      !video ||
      !scannedBarcode ||
      !restartButton ||
      !productInfo ||
      !errorDiv ||
      !manualBarcodeForm ||
      !manualBarcodeInput ||
      !overlay ||
      !scanLog
    ) {
      console.error("Не найдены необходимые элементы DOM для scanModule");
      return;
    }

    // Функция остановки сканера
    const stopScanner = () => {
      if (globalState.stream) {
        globalState.stream.getTracks().forEach(track => track.stop());
        globalState.stream = null;
      }
      Quagga.stop();
      overlay.classList.remove("active");
    };

    // Функция добавления записи в лог
    const addToScanLog = (barcode) => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = document.createElement("div");
      logEntry.textContent = `[${timestamp}] Распознан: ${barcode}`;
      scanLog.insertBefore(logEntry, scanLog.firstChild);
      while (scanLog.children.length > 10) {
        scanLog.removeChild(scanLog.lastChild);
      }
    };

    // Функция обработки штрихкода
    const processBarcode = async (barcode) => {
      try {
        scannedBarcode.textContent = `Штрихкод: ${barcode}`;
        errorDiv.style.display = "none";
        productInfo.style.display = "none";

        if (!barcode.startsWith("200") && !barcode.startsWith("300")) {
          return false; // Игнорируем неподходящие штрихкоды
        }

        if (barcode.startsWith("200")) {
          const result = await utils.fetchData(`/product/${barcode}`);
          const boxesInfo = result.boxes.length > 0
            ? result.boxes.map(box => `<a href="/box-content.html?barcode=${box.barcode}">${box.name}</a>`).join(", ")
            : "Не в коробке";
          const photoPath = result.photo_paths && result.photo_paths.length > 0
            ? result.photo_paths[0]
            : "/images/placeholder.png";

          // Карточка товара
          productInfo.innerHTML = `
            <div class="product-card">
              <div class="product-card-header">
                <h2>Найден товар</h2>
              </div>
              <div class="product-card-body">
                <img src="${photoPath}" alt="${result.name}" class="product-image">
                <div class="product-details">
                  <p><strong>ID:</strong> ${result.id}</p>
                  <p><strong>Название:</strong> <a href="/product.html?barcode=${result.barcode}">${result.name}</a></p>
                  <p><strong>Количество:</strong> ${result.quantity}</p>
                  <p><strong>Цена:</strong> ${result.price ? `${result.price} руб.` : "Не указано"}</p>
                  <p><strong>Категория:</strong> ${result.category || "Не указано"}</p>
                  <p><strong>Описание:</strong> ${result.description || "Нет описания"}</p>
                  <p><strong>Штрихкод:</strong> <a href="/barcode/${result.barcode}" target="_blank">${result.barcode}</a></p>
                  <p><strong>Коробки:</strong> ${boxesInfo}</p>
                </div>
              </div>
            </div>
          `;
          productInfo.style.display = "block";
          return true; // Успешно найден товар
        } else if (barcode.startsWith("300")) {
          window.location.href = `/box-content.html?barcode=${barcode}`;
          return true; // Перенаправление на коробку
        }
        return false;
      } catch (error) {
        utils.showMessage(errorDiv, error.message || "Ошибка обработки штрихкода", "error");
        return false; // Ошибка, продолжаем сканирование
      }
    };

    // Запуск сканера
    const startScanner = () => {
      errorDiv.style.display = "none";
      restartButton.style.display = "none";
      productInfo.style.display = "none";
      scannedBarcode.textContent = "";
      scanLog.innerHTML = "";
      overlay.classList.remove("active");
      globalState.lastDetected = null;
      globalState.detectionCount = 0;

      if (!navigator.mediaDevices?.getUserMedia) {
        utils.showMessage(errorDiv, "Ваш браузер не поддерживает камеру", "error");
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
              inputStream: {
                type: "LiveStream",
                target: video,
                constraints: {
                  width: 640,
                  height: 480,
                  facingMode: "environment",
                },
              },
              locator: {
                patchSize: "large",
                halfSample: false,
              },
              numOfWorkers: navigator.hardwareConcurrency || 4,
              decoder: {
                readers: ["ean_reader"],
              },
              locate: true,
              frequency: 10,
            },
            (err) => {
              if (err) {
                stopScanner();
                utils.showMessage(errorDiv, `Ошибка инициализации Quagga: ${err}`, "error");
                restartButton.style.display = "block";
                return;
              }
              Quagga.start();
            }
          );

          Quagga.onDetected(async (data) => {
            const barcode = data.codeResult.code;

            // Добавляем каждый штрихкод в лог
            addToScanLog(barcode);

            // Показываем рамку только для "200" или "300"
            if (barcode.startsWith("200") || barcode.startsWith("300")) {
              overlay.classList.add("active");
            } else {
              overlay.classList.remove("active");
              return; // Продолжаем сканирование для неподходящих штрихкодов
            }

            scannedBarcode.textContent = `Штрихкод: ${barcode}`;

            // Подсчитываем детекции
            if (globalState.lastDetected === barcode) {
              globalState.detectionCount++;
            } else {
              globalState.lastDetected = barcode;
              globalState.detectionCount = 1;
            }

            if (globalState.detectionCount >= 2) {
              const success = await processBarcode(barcode);
              if (success) {
                stopScanner(); // Останавливаем при успехе после 2 детекций
                restartButton.style.display = "block";
              }
              // Если success === false, продолжаем сканирование
            }
          });
        })
        .catch((err) => {
          utils.showMessage(errorDiv, `Ошибка доступа к камере: ${err}`, "error");
          restartButton.style.display = "block";
        });
    };

    // Обработка ручного ввода
    manualBarcodeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const barcode = manualBarcodeInput.value.trim();

      if (barcode.length !== 13 || isNaN(barcode)) {
        utils.showMessage(errorDiv, "Введите корректный 13-значный штрихкод", "error");
        return;
      }

      stopScanner();
      addToScanLog(barcode);
      const success = await processBarcode(barcode);
      restartButton.style.display = "block";
      if (success) {
        manualBarcodeInput.value = "";
      } else {
        startScanner();
      }
    });

    // Перезапуск сканера
    restartButton.addEventListener("click", startScanner);

    // Инициализация
    startScanner();
  },
};

const boxesModule = {
  init: () => {
    const boxesListBody = document.querySelector("#boxesList tbody");
    const boxErrorDiv = document.getElementById("boxError");
    const createBoxForm = document.getElementById("createBoxForm");
    const createResult = document.getElementById("createResult");
    const boxContentContainer = document.getElementById("boxContentContainer");
    const boxContentBody = document.querySelector("#boxContentList tbody");
    const boxContentError = document.getElementById("boxContentError");
    const boxContentName = document.getElementById("boxContentName");
    const addToBoxForm = document.getElementById("addToBoxForm");
    const addToBoxContainer = document.getElementById("addToBoxContainer");
    const addResult = document.getElementById("addResult");

    if (!boxesListBody || !boxErrorDiv || !createBoxForm || !createResult || 
        !boxContentContainer || !boxContentBody || !boxContentError || !boxContentName || 
        !addToBoxForm || !addToBoxContainer || !addResult) return;

    let currentBoxBarcode = null;

    // Загрузка списка коробок
    boxesModule.loadBoxes = async function () {
      try {
        const boxes = await utils.fetchData("/get-boxes");
        boxesListBody.innerHTML = "";
        if (!boxes || boxes.length === 0) {
          utils.showMessage(boxErrorDiv, "Коробки не найдены", "error");
          return;
        }
        boxes.forEach((box) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td><a href="#" class="clickable-barcode" data-barcode="${box.barcode}">${box.barcode}</a></td>
            <td>${box.name}</td>
            <td>
              <button class="view-content-btn" data-barcode="${box.barcode}">
                <i class="fas fa-eye"></i>
              </button>
              <button class="delete-btn" data-barcode="${box.barcode}">
                <i class="fas fa-trash"></i>
              </button>
              <a href="/barcode/${box.barcode}" download="barcode_${box.barcode}.png" class="download-btn">
                <i class="fas fa-download"></i>
              </a>
            </td>
          `;
          boxesListBody.appendChild(row);
        });
    
        // Добавляем обработчик для кликабельных штрихкодов
        boxesListBody.querySelectorAll(".clickable-barcode").forEach((link) => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const barcode = link.getAttribute("data-barcode");
            utils.downloadPNG(`/barcode/${barcode}`, `barcode_${barcode}.png`);
          });
        });
    
        // Обработчики кнопок удаления остаются без изменений
        boxesListBody.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", async () => {
            const barcode = button.getAttribute("data-barcode");
            if (confirm(`Вы уверены, что хотите удалить коробку с артикулом ${barcode}?`)) {
              try {
                const message = await utils.fetchData(`/delete-box/${barcode}?force=true`, {
                  method: "DELETE",
                });
                utils.showMessage(boxErrorDiv, message, "success");
                boxesModule.loadBoxes();
                boxContentContainer.style.display = "none";
                addToBoxContainer.style.display = "none";
              } catch (error) {
                utils.showMessage(boxErrorDiv, error.message, "error");
              }
            }
          });
        });
      } catch (error) {
        utils.showMessage(boxErrorDiv, error.message, "error");
      }
    };

    boxesModule.loadBoxes();

    createBoxForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("boxName").value;
      createResult.style.display = "none";
      createResult.classList.remove("success", "error");
      try {
        const message = await utils.fetchData("/create-box", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        utils.showMessage(createResult, message, "success");
        boxesModule.loadBoxes();
        createBoxForm.reset(); // Очистка формы после успеха
      } catch (error) {
        utils.showMessage(createResult, error.message, "error");
      }
    });

    // Обработка кликов по кнопкам
    boxesListBody.addEventListener("click", async (e) => {
      const viewBtn = e.target.closest(".view-content-btn");
      const deleteBtn = e.target.closest(".delete-btn");

      if (viewBtn) {
        e.stopPropagation();
        currentBoxBarcode = viewBtn.getAttribute("data-barcode");
        try {
          const content = await utils.fetchData(`/box-content/${currentBoxBarcode}`);
          boxContentName.textContent = content.name;
          boxContentBody.innerHTML = "";
          if (!content.items || content.items.length === 0) {
            utils.showMessage(boxContentError, "Товары в коробке не найдены", "error");
          } else {
            content.items.forEach((item) => {
              const row = document.createElement("tr");
              row.innerHTML = `
                <td>${item.id}</td>
                <td>${
                  item.photo_paths && item.photo_paths.length > 0
                    ? `<img src="${item.photo_paths[0]}" alt="${item.name}" style="max-width: 50px; max-height: 50px;">`
                    : "-"
                }</td>
                <td><a href="/product.html?barcode=${item.barcode}">${item.name}</a></td>
                <td>${item.barcode}</td>
                <td>${item.quantity}</td>
                <td>${item.price ? item.price + " ₽" : "-"}</td>
                <td>${item.category || "-"}</td>
                <td>
                  <button class="delete-from-box-btn" data-product-barcode="${item.barcode}">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              `;
              boxContentBody.appendChild(row);
            });
            utils.showMessage(boxContentError, "", ""); // Очистка ошибок
          }
          boxContentContainer.style.display = "block";
          addToBoxContainer.style.display = "block";
        } catch (error) {
          utils.showMessage(boxContentError, error.message, "error");
        }
      }

      if (deleteBtn) {
        e.stopPropagation();
        const barcode = deleteBtn.getAttribute("data-barcode");
        if (confirm(`Удалить коробку с штрихкодом ${barcode}?`)) {
          try {
            const message = await utils.fetchData(`/delete-box/${barcode}?force=true`, {
              method: "DELETE",
            });
            utils.showMessage(boxErrorDiv, message, "success");
            boxesModule.loadBoxes();
            boxContentContainer.style.display = "none";
            addToBoxContainer.style.display = "none";
          } catch (error) {
            utils.showMessage(boxErrorDiv, error.message, "error");
          }
        }
      }
    });

    // Удаление товара из коробки
    boxContentBody.addEventListener("click", async (e) => {
      if (e.target.closest(".delete-from-box-btn")) {
        e.stopPropagation();
        const button = e.target.closest(".delete-from-box-btn");
        const productBarcode = button.getAttribute("data-product-barcode");
        if (confirm(`Удалить товар ${productBarcode} из коробки ${currentBoxBarcode}?`)) {
          try {
            const message = await utils.fetchData(
              `/delete-from-box/${currentBoxBarcode}/${productBarcode}`,
              { method: "DELETE" }
            );
            utils.showMessage(boxContentError, message, "success");
            const content = await utils.fetchData(`/box-content/${currentBoxBarcode}`);
            boxContentBody.innerHTML = "";
            content.items.forEach((item) => {
              const row = document.createElement("tr");
              row.innerHTML = `
                <td>${item.id}</td>
                <td>${
                  item.photo_paths && item.photo_paths.length > 0
                    ? `<img src="${item.photo_paths[0]}" alt="${item.name}" style="max-width: 50px; max-height: 50px;">`
                    : "-"
                }</td>
                <td><a href="/product.html?barcode=${item.barcode}">${item.name}</a></td>
                <td>${item.barcode}</td>
                <td>${item.quantity}</td>
                <td>${item.price ? item.price + " ₽" : "-"}</td>
                <td>${item.category || "-"}</td>
                <td>
                  <button class="delete-from-box-btn" data-product-barcode="${item.barcode}">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              `;
              boxContentBody.appendChild(row);
            });
          } catch (error) {
            utils.showMessage(boxContentError, error.message, "error");
          }
        }
      }
    });

    // Добавление товара в коробку
    addToBoxForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentBoxBarcode) {
        utils.showMessage(addResult, "Выберите коробку", "error");
        return;
      }
      const productBarcode = document.getElementById("productBarcode").value;
      const quantity = parseInt(document.getElementById("productQuantity").value);
      if (isNaN(quantity) || quantity <= 0) {
        utils.showMessage(addResult, "Введите корректное количество", "error");
        return;
      }
      try {
        const message = await utils.fetchData("/add-to-box", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boxBarcode: currentBoxBarcode, productBarcode, quantity }),
        });
        utils.showMessage(addResult, message, "success");
        addToBoxForm.reset();
        const content = await utils.fetchData(`/box-content/${currentBoxBarcode}`);
        boxContentBody.innerHTML = "";
        content.items.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${item.id}</td>
            <td>${
              item.photo_paths && item.photo_paths.length > 0
                ? `<img src="${item.photo_paths[0]}" alt="${item.name}" style="max-width: 50px; max-height: 50px;">`
                : "-"
            }</td>
            <td><a href="/product.html?barcode=${item.barcode}">${item.name}</a></td>
            <td>${item.barcode}</td>
            <td>${item.quantity}</td>
            <td>${item.price ? item.price + " ₽" : "-"}</td>
            <td>${item.category || "-"}</td>
            <td>
              <button class="delete-from-box-btn" data-product-barcode="${item.barcode}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          boxContentBody.appendChild(row);
        });
      } catch (error) {
        utils.showMessage(addResult, error.message, "error");
      }
    });
  },
  loadBoxes: null,
};

const boxContentModule = {
  init: () => {
    const boxContentBody = document.getElementById("boxContentBody");
    const errorDiv = document.getElementById("error");
    const boxNameElement = document.getElementById("boxName");
    const barcode = new URLSearchParams(window.location.search).get("barcode");

    if (!barcode)
      return utils.showMessage(errorDiv, "Штрихкод не указан", "error");

    boxContentModule.loadBoxContent = async function () {
      try {
        const data = await utils.fetchData(`/box-content/${barcode}`);
        boxNameElement.textContent = `Содержимое коробки: ${data.name}`;
        
        boxContentBody.innerHTML = "";
        if (data.items.length === 0) {
          utils.showMessage(errorDiv, "Товары в коробке не найдены", "error");
          return;
        }
        errorDiv.style.display = "none";
        data.items.forEach((item) => {
          const row = document.createElement("tr");
          // Формируем информацию о коробках
          const boxInfo = item.boxes.length > 0
            ? item.boxes.map(box => `<a href="/box-content.html?barcode=${box.barcode}">${box.name}</a>`).join(", ")
            : "Не в коробке";
          row.innerHTML = `
            <td>${item.id}</td>
            <td>${
              item.photo_paths && item.photo_paths.length > 0
                ? `<img src="${item.photo_paths[0]}" alt="${item.name}" style="max-width: 50px; max-height: 50px;">`
                : "-"
            }</td>
            <td><a href="/product.html?barcode=${item.barcode}">${item.name}</a></td>
            <td>${item.quantity}</td>
            <td>${item.price ? item.price + " ₽" : "-"}</td>
            <td>${item.category || "-"}</td>
            <td>${item.barcode}</td>
            <td>${boxInfo}</td>
            <td>
              <button class="edit-btn" data-box-barcode="${barcode}" data-product-barcode="${item.barcode}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-btn" data-box-barcode="${barcode}" data-product-barcode="${item.barcode}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          boxContentBody.appendChild(row);
        });

        boxContentBody.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", async () => {
            const boxBarcode = button.getAttribute("data-box-barcode");
            const productBarcode = button.getAttribute("data-product-barcode");
            if (
              confirm(
                `Удалить товар с артикулом ${productBarcode} из коробки ${boxBarcode}?`
              )
            ) {
              try {
                const message = await utils.fetchData(
                  `/delete-from-box/${boxBarcode}/${productBarcode}`,
                  { method: "DELETE" }
                );
                utils.showMessage(errorDiv, message, "success");
                boxContentModule.loadBoxContent();
              } catch (error) {
                utils.showMessage(errorDiv, error.message, "error");
              }
            }
          });
        });

        const modal = document.getElementById("editBoxItemModal");
        const closeBtn = modal.querySelector(".close");
        const editForm = document.getElementById("editBoxItemForm");
        const editResult = document.getElementById("editBoxItemResult");

        boxContentBody.querySelectorAll(".edit-btn").forEach((button) => {
          button.addEventListener("click", async () => {
            const boxBarcode = button.getAttribute("data-box-barcode");
            const productBarcode = button.getAttribute("data-product-barcode");
            try {
              const data = await utils.fetchData(`/box-content/${boxBarcode}`);
              const item = data.items.find((i) => i.barcode === productBarcode);
              document.getElementById("editBoxItemQuantity").value = item.quantity;
              modal.style.display = "block";

              editForm.onsubmit = async (e) => {
                e.preventDefault();
                const quantity = parseInt(document.getElementById("editBoxItemQuantity").value);
                if (isNaN(quantity) || quantity < 0) {
                  utils.showMessage(editResult, "Введите корректное количество", "error");
                  return;
                }
                try {
                  const message = await utils.fetchData(
                    `/update-box-item/${boxBarcode}/${productBarcode}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ quantity }),
                    }
                  );
                  utils.showMessage(editResult, message, "success");
                  modal.style.display = "none";
                  boxContentModule.loadBoxContent();
                } catch (error) {
                  utils.showMessage(editResult, error.message, "error");
                }
              };
            } catch (error) {
              utils.showMessage(errorDiv, error.message, "error");
            }
          });
        });

        closeBtn.onclick = () => (modal.style.display = "none");
        window.onclick = (event) => {
          if (event.target == modal) modal.style.display = "none";
        };
      } catch (error) {
        utils.showMessage(errorDiv, error.message, "error");
      }
    };

    boxContentModule.loadBoxContent();
  },
  loadBoxContent: null,
};

const productModule = {
  init: () => {
    const productPhotoContainer = document.getElementById("productPhotoContainer");
    const productName = document.getElementById("productName");
    const productId = document.getElementById("productId");
    const productBarcode = document.getElementById("productBarcode");
    const productQuantity = document.getElementById("productQuantity");
    const productPrice = document.getElementById("productPrice");
    const productCategory = document.getElementById("productCategory");
    const productDescription = document.getElementById("productDescription");
    const productBoxes = document.getElementById("productBoxes");
    const downloadBarcode = document.getElementById("downloadBarcode");
    const errorDiv = document.getElementById("error");
    const prevButton = document.getElementById("prevPhoto");
    const nextButton = document.getElementById("nextPhoto");

    if (
      !productPhotoContainer ||
      !productName ||
      !productId ||
      !productBarcode ||
      !productQuantity ||
      !productPrice ||
      !productCategory ||
      !productDescription ||
      !productBoxes ||
      !downloadBarcode ||
      !errorDiv ||
      !prevButton ||
      !nextButton
    )
      return;

    const barcode = new URLSearchParams(window.location.search).get("barcode");
    if (!barcode) {
      utils.showMessage(errorDiv, "Штрихкод не указан", "error");
      return;
    }

    let currentPhotoIndex = 0;
    let photoPaths = [];

    async function loadProduct() {
      try {
        const product = await utils.fetchData(`/product/${barcode}`);
        productName.textContent = product.name;
        productId.textContent = product.id;
        productBarcode.textContent = product.barcode;
        productQuantity.textContent = product.quantity;
        productPrice.textContent = product.price ? `${product.price} руб.` : "Не указано";
        productCategory.textContent = product.category || "Не указано";
        productDescription.textContent = product.description || "Нет описания";
        downloadBarcode.href = `/barcode/${product.barcode}`;

        // Отображаем список коробок
        productBoxes.innerHTML = product.boxes.length > 0
          ? product.boxes.map(box => `<a href="/box-content.html?barcode=${box.barcode}">${box.name}</a>`).join(", ")
          : "Не в коробке";

        photoPaths = product.photo_paths.length > 0 ? product.photo_paths : ["/images/placeholder.png"];
        updatePhoto();

        prevButton.addEventListener("click", () => {
          if (currentPhotoIndex > 0) {
            currentPhotoIndex--;
            updatePhoto();
          }
        });

        nextButton.addEventListener("click", () => {
          if (currentPhotoIndex < photoPaths.length - 1) {
            currentPhotoIndex++;
            updatePhoto();
          }
        });
      } catch (error) {
        utils.showMessage(errorDiv, error.message, "error");
      }
    }

    function updatePhoto() {
      const img = productPhotoContainer.querySelector("img") || document.createElement("img");
      img.src = photoPaths[currentPhotoIndex];
      img.alt = `Фото товара ${currentPhotoIndex + 1}`;
      img.style.maxWidth = "100%";
      if (!productPhotoContainer.contains(img)) {
        productPhotoContainer.appendChild(img);
      }
      prevButton.disabled = currentPhotoIndex === 0;
      nextButton.disabled = currentPhotoIndex === photoPaths.length - 1;
    }

    loadProduct();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const path = document.location.pathname;
  if (path === "/index.html") indexModule.init();
  else if (path === "/products.html") productsModule.init();
  else if (path === "/scan.html") scanModule.init();
  else if (path === "/boxes.html") boxesModule.init();
  else if (path === "/box-content.html") boxContentModule.init();
  else if (path === "/product.html") productModule.init();
});