"use client";

import { useState, useEffect, useRef } from "react";
import { Product, Box, BoxItem } from "@/types";
import ProductImage from "@/components/ProductImage";
import Barcode from "@/components/Barcode";
import Link from "next/link";
import {
  CameraIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import JsBarcode from "jsbarcode";

declare global {
  interface Window {
    Quagga: any;
  }
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [loadingBoxItems, setLoadingBoxItems] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraZoom, setCameraZoom] = useState(1.0);

  // New states for camera and scan history
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<{
    barcode: string;
    timestamp: string;
    status: string;
  }[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize/unlock audio context
  const initAudio = () => {
    if (typeof window === "undefined") return;
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch((e) => console.error("Error resuming AudioContext:", e));
    }
  };

  // Play a pleasant beep sound upon successful scan
  const playBeep = () => {
    try {
      initAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.error("Ошибка воспроизведения звука:", e);
    }
  };

  // Get list of available cameras
  const loadCameras = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setCameras(videoDevices);

      // If camera is not selected, select the rear camera or the first available one
      if (videoDevices.length > 0 && !selectedCameraId) {
        const backCam = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("задн") ||
            d.label.toLowerCase().includes("основн")
        );
        setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
      }
    } catch (e) {
      console.error("Ошибка получения списка камер:", e);
    }
  };

  // Load cameras on mount
  useEffect(() => {
    loadCameras();
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener?.("devicechange", loadCameras);
    }
    return () => {
      if (typeof window !== "undefined" && navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener?.("devicechange", loadCameras);
      }
    };
  }, []);

  // Initialize history from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("scanHistory");
      if (saved) {
        try {
          setScanHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Ошибка загрузки истории сканирования:", e);
        }
      }
    }
  }, []);

  // Add to scan history
  const addToScanHistory = (code: string, status: string = "Загрузка...") => {
    setScanHistory((prev) => {
      const filtered = prev.filter((item) => item.barcode !== code);
      const newEntry = {
        barcode: code,
        timestamp: new Date().toLocaleTimeString(),
        status,
      };
      const updated = [newEntry, ...filtered].slice(0, 20);
      localStorage.setItem("scanHistory", JSON.stringify(updated));
      return updated;
    });
  };

  // Update status in scan history
  const updateScanHistoryStatus = (code: string, status: string) => {
    setScanHistory((prev) => {
      const updated = prev.map((item) => {
        if (item.barcode === code) {
          return { ...item, status };
        }
        return item;
      });
      localStorage.setItem("scanHistory", JSON.stringify(updated));
      return updated;
    });
  };
  const [detectingCode, setDetectingCode] = useState<boolean>(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    // Load the Quagga library dynamically
    const loadQuagga = async () => {
      if (typeof window !== "undefined" && !window.Quagga) {
        try {
          const QuaggaModule = await import("quagga").catch((err) => {
            console.error("Ошибка импорта библиотеки Quagga:", err);
            setError(
              "Не удалось загрузить библиотеку сканирования штрих-кодов"
            );
            return { default: null };
          });

          if (QuaggaModule && QuaggaModule.default) {
            window.Quagga = QuaggaModule.default;
            initializeScanner();
          }
        } catch (error) {
          console.error("Ошибка при загрузке библиотеки Quagga:", error);
          setError("Не удалось загрузить библиотеку сканирования штрих-кодов");
        }
      } else if (window.Quagga) {
        initializeScanner();
      }
    };

    loadQuagga();

    return () => {
      if (typeof window !== "undefined" && window.Quagga) {
        try {
          window.Quagga.stop();
        } catch (error) {
          console.error("Ошибка при остановке Quagga в cleanup:", error);
        }
      }
    };
  }, []);

  // Handler for touch gestures (to zoom camera in/out)
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      if (!videoRef.current || !isScanning || e.touches.length !== 2) return;

      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate distance between touch points
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Save initial distance
      const touchStartHandler = () => {
        const initialDist = dist;

        const touchMoveHandler = (e: TouchEvent) => {
          if (e.touches.length !== 2) return;

          const touch1 = e.touches[0];
          const touch2 = e.touches[1];

          const newDist = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );

          // Apply zoom changes
          const newZoom = cameraZoom * (newDist / initialDist);
          setCameraZoom(Math.max(1.0, Math.min(2.0, newZoom)));
        };

        document.addEventListener("touchmove", touchMoveHandler);
        document.addEventListener(
          "touchend",
          () => {
            document.removeEventListener("touchmove", touchMoveHandler);
          },
          { once: true }
        );
      };

      touchStartHandler();
    };

    if (videoRef.current && isScanning) {
      videoRef.current.addEventListener("touchstart", handleTouch);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("touchstart", handleTouch);
      }
    };
  }, [isScanning, cameraZoom]);

  // Function for manual camera focus
  const handleManualFocus = async () => {
    try {
      if (!videoRef.current) return;

      const videoTrack =
        videoRef.current.srcObject instanceof MediaStream
          ? videoRef.current.srcObject.getVideoTracks()[0]
          : null;

      if (videoTrack) {
        try {
          // Use a more general approach with any to bypass type constraints
          const capabilities = videoTrack.getCapabilities() as any;

          if (capabilities && capabilities.focusMode) {
            await (videoTrack as any).applyConstraints({
              advanced: [{ focusMode: "manual" }],
            });

            // Return to continuous mode 1 second after manual focus
            setTimeout(async () => {
              await (videoTrack as any).applyConstraints({
                advanced: [{ focusMode: "continuous" }],
              });
            }, 1000);
          }
        } catch (e) {
          console.error("Ошибка при работе с фокусировкой:", e);
        }
      }
    } catch (error) {
      console.error("Ошибка при попытке фокусировки камеры:", error);
    }
  };

  const initializeScanner = (deviceId?: string) => {
    if (typeof window === "undefined" || !window.Quagga) {
      console.error("Quagga не доступна");
      setError(
        "Библиотека сканирования не доступна. Пожалуйста, перезагрузите страницу."
      );
      return;
    }

    // Stop previous scan session if it is active
    if (window.Quagga.initialized) {
      try {
        window.Quagga.stop();
      } catch (error) {
        console.error("Ошибка при остановке Quagga:", error);
      }
    }

    // Reset state
    setIsScanning(true);
    setBarcode(null);
    setProduct(null);
    setBox(null);
    setBoxItems([]);
    setError(null);

    const activeDeviceId = deviceId || selectedCameraId;
    const cameraConstraint = activeDeviceId
      ? { deviceId: { exact: activeDeviceId } }
      : { facingMode: "environment" };

    // Initialize scanner with timeout
    setTimeout(() => {
      try {
        window.Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: document.querySelector("#scanner-container"),
              constraints: {
                ...cameraConstraint,
                width: { min: 640, ideal: 1280 },
                height: { min: 480, ideal: 720 },
                aspectRatio: { min: 1, max: 2 },
                advanced: [
                  {
                    focusMode: "continuous",
                    exposureMode: "continuous",
                    whiteBalanceMode: "continuous",
                  } as any,
                ],
              },
              area: {
                top: "20%",
                right: "20%",
                left: "20%",
                bottom: "20%",
              },
            },
            locator: {
              patchSize: "medium", // Optimized
              halfSample: true,
            },
            numOfWorkers: typeof navigator !== "undefined" ? Math.min(navigator.hardwareConcurrency || 4, 4) : 4, // Optimized
            decoder: {
              readers: [
                {
                  format: "ean_reader",
                  config: {
                    normalizeBarSpaceWidth: true,
                    supplements: false,
                    enableEAN2: false,
                    enableEAN5: false,
                    convertEAN2toEAN13: false,
                  },
                },
              ],
              multiple: false,
              debug: false,
            },
            locate: true,
            frequency: 10, // Optimized: increase frequency to 10 frames/sec
          },
          (err: any) => {
            if (err) {
              console.error("Ошибка инициализации сканера:", err);
              setError(
                "Не удалось инициализировать сканер. Проверьте разрешения камеры."
              );
              setIsScanning(false);
              return;
            }

            window.Quagga.initialized = true;
            window.Quagga.start();
            loadCameras(); // Load available cameras (after permissions are granted)

            // Add processed callback handler to highlight scanner frame
            window.Quagga.onProcessed((result: any) => {
              if (processingRef.current) return;

              processingRef.current = true;

              if (result && result.codeResult && result.codeResult.code) {
                const code = result.codeResult.code;

                if (code.length === 13 && validateEAN13(code)) {
                  setDetectingCode(true);
                  setDetectedCode(code);

                  setTimeout(() => {
                    setDetectingCode(false);
                    setDetectedCode(null);
                    processingRef.current = false;
                  }, 500);
                } else {
                  setDetectingCode(false);
                  setDetectedCode(null);
                  processingRef.current = false;
                }
              } else {
                setDetectingCode(false);
                setDetectedCode(null);

                setTimeout(() => {
                  processingRef.current = false;
                }, 100);
              }
            });

            // Detected callback handler
            window.Quagga.onDetected((result: any) => {
              try {
                const code = result.codeResult.code;
                if (!code || code.length !== 13) return;

                console.log(`Обнаружен код: ${code}`);

                if (!validateEAN13(code)) {
                  console.log(`Неверная контрольная сумма для кода: ${code}`);
                  return;
                }

                if (lastScannedCode === code) {
                  console.log(`Код ${code} уже был обработан`);
                  return;
                }

                setLastScannedCode(code);
                playBeep(); // Play a beep sound on successful detection

                let prefix = code.substring(0, 3);

                // Add to scan history
                addToScanHistory(code);

                // Process code depending on the prefix
                if (prefix === "200") {
                  fetchProductOnly(code);
                } else if (prefix === "300") {
                  fetchBoxOnly(code);
                } else {
                  setError(
                    `Неподдерживаемый префикс штрих-кода: ${prefix}. Поддерживаются только 200 и 300.`
                  );
                  updateScanHistoryStatus(code, "Неподдерживаемый префикс");
                }
              } catch (error) {
                console.error("Ошибка в обработчике onDetected:", error);
              }
            });
          }
        );
      } catch (error) {
        console.error("Ошибка при инициализации сканера:", error);
        setError(
          "Не удалось инициализировать сканер. Пожалуйста, перезагрузите страницу."
        );
        setIsScanning(false);
      }
    }, 1000);
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (isScanning && window.Quagga) {
      try {
        window.Quagga.stop();
      } catch (e) {
        console.error("Ошибка при остановке Quagga для смены камеры:", e);
      }
      initializeScanner(deviceId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initAudio();
    if (manualBarcode.length === 13) {
      const prefix = manualBarcode.substring(0, 3);
      if (prefix !== "200" && prefix !== "300") {
        setError(
          `Неподдерживаемый префикс штрих-кода: ${prefix}. Поддерживаются только 200 и 300.`
        );
        return;
      }

      addToScanHistory(manualBarcode);
      fetchProduct(manualBarcode);
    } else {
      setError("Неверный формат штрихкода. Должен быть EAN13 (13 цифр)");
    }
  };

  const handleHistoryClick = async (code: string) => {
    initAudio();
    setBarcode(code);
    setError(null);
    setProduct(null);
    setBox(null);
    setBoxItems([]);
    
    addToScanHistory(code, "Загрузка...");
    await fetchProduct(code);
  };

  const fetchProduct = async (code: string) => {
    const prefix = code.substring(0, 3);

    if (prefix === "200") {
      return fetchProductOnly(code);
    } else if (prefix === "300") {
      return fetchBoxOnly(code);
    } else {
      setError(
        `Неподдерживаемый префикс штрих-кода: ${prefix}. Поддерживаются только 200 и 300.`
      );
      return false;
    }
  };

  const fetchProductOnly = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      const productResponse = await fetch(`/api/products/barcode/${code}`);

      if (productResponse.ok) {
        const data = await productResponse.json();
        console.log("Найден товар:", data);
        setProduct(data);
        setBox(null);
        setBarcode(code);
        updateScanHistoryStatus(code, data.name || "Товар без названия");

        if (window.Quagga) {
          try {
            window.Quagga.stop();
            setIsScanning(false);
          } catch (error) {
            console.error("Ошибка при остановке Quagga:", error);
            setIsScanning(false);
          }
        }
        return true;
      } else if (productResponse.status === 404) {
        console.log(`Товар не найден для кода: ${code}`);
        setError(`Товар со штрихкодом ${code} не найден`);
        setProduct(null);
        setBox(null);
        updateScanHistoryStatus(code, "Не найдено");
      } else {
        throw new Error("Ошибка при получении данных");
      }

      return false;
    } catch (err) {
      console.error("Ошибка при поиске товара:", err);
      setError("Ошибка при поиске товара");
      setProduct(null);
      setBox(null);
      updateScanHistoryStatus(code, "Не найдено");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchBoxOnly = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      const boxResponse = await fetch(`/api/boxes/barcode/${code}`);

      if (boxResponse.ok) {
        const boxData = await boxResponse.json();
        console.log("Найдена коробка:", boxData);
        setBox(boxData);
        setProduct(null);
        setBarcode(code);
        updateScanHistoryStatus(code, boxData.name || "Коробка без названия");

        await fetchBoxContent(boxData.id);

        if (window.Quagga) {
          try {
            window.Quagga.stop();
            setIsScanning(false);
          } catch (error) {
            console.error("Ошибка при остановке Quagga:", error);
            setIsScanning(false);
          }
        }
        return true;
      } else if (boxResponse.status === 404) {
        console.log(`Коробка не найдена для кода: ${code}`);
        setError(`Коробка со штрихкодом ${code} не найдена`);
        setProduct(null);
        setBox(null);
        setBoxItems([]);
        updateScanHistoryStatus(code, "Не найдено");
      } else {
        throw new Error("Ошибка при получении данных");
      }

      return false;
    } catch (err) {
      console.error("Ошибка при поиске коробки:", err);
      setError("Ошибка при поиске коробки");
      setProduct(null);
      setBox(null);
      setBoxItems([]);
      updateScanHistoryStatus(code, "Не найдено");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchBoxContent = async (boxId: number) => {
    try {
      setLoadingBoxItems(true);

      const response = await fetch(`/api/boxes/${boxId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          setBoxItems(data.items);
        } else {
          setBoxItems([]);
        }
      } else {
        console.error("Ошибка при загрузке содержимого коробки");
        setBoxItems([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке содержимого коробки:", error);
      setBoxItems([]);
    } finally {
      setLoadingBoxItems(false);
    }
  };

  const restartScanner = () => {
    initAudio();
    setBarcode(null);
    setProduct(null);
    setBox(null);
    setBoxItems([]);
    setError(null);
    setManualBarcode("");
    setLastScannedCode(null);

    try {
      initializeScanner();
    } catch (error) {
      console.error("Ошибка при перезапуске сканера:", error);
      setError("Не удалось перезапустить сканер");
    }
  };

  const validateEAN13 = (code: string): boolean => {
    if (code.length !== 13) return false;
    if (!/^\d+$/.test(code)) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    }

    const checksum = (10 - (sum % 10)) % 10;
    const providedChecksum = parseInt(code[12], 10);

    return checksum === providedChecksum;
  };

  const downloadBarcode = (barcode: string) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.id = `temp-barcode-${barcode}`;
    document.body.appendChild(tempCanvas);

    try {
      JsBarcode(tempCanvas, barcode, {
        format: "EAN13",
        width: 1.5,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });

      const link = document.createElement("a");
      link.download = `barcode-${barcode}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      document.body.removeChild(tempCanvas);
    } catch (error) {
      console.error("Ошибка при создании штрих-кода:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-[100rem] mx-auto animate-fadeIn pb-12">
      {/* Page Header */}
      <header className="mb-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-color-primary)]">
          Терминал сканирования
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-color-muted)]">
          Используйте камеру устройства или ручной ввод для идентификации товаров и коробок.
        </p>
      </header>

      {/* Errors and Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5 mt-0.5 flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <span className="font-semibold block">Внимание</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-sm flex items-center gap-3 animate-pulse">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          <span className="font-medium">Запрос к базе данных...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* --- SCANNING COLUMN (7/12) --- */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-[var(--card-border)]/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">HUD Камеры</CardTitle>
                  <CardDescription>Поместите штрихкод в обозначенную область</CardDescription>
                </div>
                {/* Camera Selector */}
                {cameras.length > 0 && (
                  <div className="w-44 sm:w-56">
                    <select
                      id="camera-select"
                      value={selectedCameraId}
                      onChange={(e) => handleCameraChange(e.target.value)}
                      className="bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs rounded-md block w-full py-1.5 px-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {cameras.map((camera, index) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Камера ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Scanner Container with Tech HUD Frame */}
              <div className="tech-hud-frame w-full max-w-lg mx-auto bg-black rounded-lg overflow-hidden border border-[var(--card-border)] aspect-[4/3] relative">
                <div className="tech-hud-frame-inner w-full h-full">
                  {/* Video Stream */}
                  <video ref={videoRef} className="w-full h-full object-cover grayscale brightness-90 contrast-125" />
                  
                  {/* Target Sight Overlay */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center p-8 bg-black/10">
                    <div className={cn(
                      "w-3/4 h-1/2 border-2 border-dashed rounded flex flex-col items-center justify-center transition-all duration-300 relative",
                      detectingCode 
                        ? "border-emerald-500 bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" 
                        : "border-indigo-500 bg-black/20"
                    )}>
                      {/* Laser Line */}
                      <div className="w-full absolute top-0 left-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] scan-laser-line pointer-events-none"></div>

                      {detectingCode && detectedCode && (
                        <div className="bg-emerald-500/90 text-white font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-lg shadow-emerald-500/20">
                          Code Detected
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute top-3 right-3 flex items-center bg-black/75 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded-md text-[10px] font-mono tracking-wider uppercase z-20">
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full mr-2 animate-pulse",
                      detectingCode ? "bg-emerald-500" : "bg-indigo-500"
                    )}></span>
                    <span>{detectingCode ? "LOCK" : "SEARCHING..."}</span>
                  </div>

                  {/* HUD Layout Grid */}
                  <div className="absolute inset-0 border border-white/5 pointer-events-none grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/5"></div>
                    <div className="border-r border-b border-white/5"></div>
                    <div className="border-b border-white/5"></div>
                    <div className="border-r border-b border-white/5"></div>
                    <div className="border-r border-b border-white/5"></div>
                    <div className="border-b border-white/5"></div>
                    <div className="border-r border-white/5"></div>
                    <div className="border-r border-white/5"></div>
                    <div></div>
                  </div>
                </div>
              </div>

              {/* Camera Control */}
              <div className="flex mt-6 gap-3 justify-center">
                {isScanning ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (window.Quagga) {
                          try {
                            window.Quagga.stop();
                            setIsScanning(false);
                            setError(null);
                          } catch (error) {
                            console.error(error);
                            setIsScanning(false);
                          }
                        }
                      }}
                      className="text-xs"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Пауза
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCameraZoom(1.0);
                        if (window.Quagga && window.Quagga.initialized) {
                          try {
                            window.Quagga.stop();
                            initializeScanner();
                          } catch (error) {
                            console.error(error);
                          }
                        } else {
                          initializeScanner();
                        }
                      }}
                      className="text-xs"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Сброс
                    </Button>
                  </>
                ) : (
                  <Button onClick={restartScanner} className="text-xs">
                    <CameraIcon className="h-4 w-4 mr-2" />
                    {barcode ? "Сканировать повторно" : "Активировать сканер"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scan Results in Main Column */}
          {(product || box) && (
            <div className="space-y-6">
              {/* PRODUCT IDENTIFIED */}
              {product && (
                <Card>
                  <CardHeader className="pb-3 border-b border-[var(--card-border)]/50">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-semibold">Идентифицирован товар</CardTitle>
                      <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded">
                        Товар
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="sm:w-1/3 flex-shrink-0">
                        {product.photo_paths && product.photo_paths.length > 0 ? (
                          <ProductImage
                            src={product.photo_paths[0]}
                            alt={product.name}
                            className="w-full rounded-lg border border-[var(--card-border)] aspect-square object-cover"
                          />
                        ) : (
                          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg aspect-square flex items-center justify-center">
                            <span className="text-xs text-[var(--text-color-muted)]">Нет фотографии</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-[var(--text-color-primary)]">
                          {product.name}
                        </h2>
                        
                        <div className="divide-y divide-[var(--card-border)] text-xs sm:text-sm">
                          <div className="flex py-2 justify-between">
                            <span className="text-[var(--text-color-muted)]">Штрихкод</span>
                            <span
                              onClick={() => downloadBarcode(product.barcode)}
                              className="font-mono text-indigo-500 hover:underline cursor-pointer"
                              title="Скачать штрихкод"
                            >
                              {product.barcode}
                            </span>
                          </div>
                          <div className="flex py-2 justify-between">
                            <span className="text-[var(--text-color-muted)]">Категория</span>
                            <span className="font-medium">{product.category || "Не указана"}</span>
                          </div>
                          <div className="flex py-2 justify-between">
                            <span className="text-[var(--text-color-muted)]">В наличии</span>
                            <span className="font-semibold text-emerald-500">{product.quantity || 0} шт.</span>
                          </div>
                        </div>

                        {product.description && (
                          <div className="pt-2">
                            <span className="text-xs font-semibold text-[var(--text-color-muted)] uppercase tracking-wider block mb-1">
                              Описание
                            </span>
                            <p className="text-xs text-[var(--text-color-secondary)] leading-relaxed bg-[var(--background)] p-2.5 rounded border border-[var(--card-border)]">
                              {product.description}
                            </p>
                          </div>
                        )}

                        <div className="pt-4 flex gap-2">
                          <Link href={`/product/${product.id}`} className={cn(buttonVariants({ variant: "default", size: "sm" }), "no-underline")}>
                            Подробнее
                          </Link>
                          <Button variant="outline" size="sm" onClick={restartScanner}>
                            Далее
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* BOX IDENTIFIED */}
              {box && (
                <Card>
                  <CardHeader className="pb-3 border-b border-[var(--card-border)]/50">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-semibold">Идентифицирована коробка</CardTitle>
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-2 py-0.5 rounded">
                        Коробка
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-[var(--text-color-primary)]">
                            {box.name}
                          </h2>
                          <p className="text-xs text-[var(--text-color-muted)] font-mono mt-1">
                            Штрихкод:{" "}
                            <span
                              className="text-indigo-500 hover:underline cursor-pointer"
                              onClick={() => downloadBarcode(box.barcode)}
                              title="Скачать штрихкод"
                            >
                              {box.barcode}
                            </span>
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-[var(--card-border)] flex-shrink-0">
                          <Barcode
                            value={box.barcode}
                            height={50}
                            width={1.2}
                            fontSize={10}
                            margin={2}
                            className="max-w-full"
                            textMargin={2}
                            id={`barcode-${box.barcode}`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/box-content?barcode=${box.barcode}`} className={cn(buttonVariants({ variant: "default", size: "sm" }), "no-underline")}>
                          Внутрь коробки
                        </Link>
                        <Button variant="outline" size="sm" onClick={restartScanner}>
                          Далее
                        </Button>
                      </div>

                      {/* Box Contents */}
                      <div className="pt-4 border-t border-[var(--card-border)]/50">
                        <h3 className="text-sm font-semibold mb-3">Содержимое коробки ({boxItems.length} поз.)</h3>
                        {loadingBoxItems ? (
                          <div className="flex items-center justify-center py-6 text-xs text-indigo-500">
                            <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
                            Загрузка...
                          </div>
                        ) : (
                          <DataTable
                            columns={[
                              {
                                key: "photo",
                                header: "",
                                render: (item: BoxItem) => (
                                  <div className="w-8 h-8 rounded overflow-hidden border border-[var(--card-border)]">
                                    {item.photo_paths && item.photo_paths.length > 0 ? (
                                      <ProductImage
                                        src={item.photo_paths[0]}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-[var(--background)] flex items-center justify-center">
                                        <span className="text-[9px] text-[var(--text-color-muted)]">N/A</span>
                                      </div>
                                    )}
                                  </div>
                                ),
                                mobilePriority: 1,
                              },
                              {
                                key: "name",
                                header: "Наименование",
                                render: (item: BoxItem) => (
                                  <div className="font-medium text-xs sm:text-sm text-[var(--text-color-primary)]">
                                    {item.name}
                                  </div>
                                ),
                                mobilePriority: 1,
                              },
                              {
                                key: "quantity",
                                header: "Кол-во",
                                render: (item: BoxItem) => (
                                  <span className="text-xs sm:text-sm font-semibold">{item.quantity} шт.</span>
                                ),
                                mobilePriority: 2,
                              },
                              {
                                key: "actions",
                                header: "",
                                render: (item: BoxItem) => (
                                  <Link
                                    href={`/product/${item.id}`}
                                    className="text-xs text-indigo-500 hover:underline"
                                  >
                                    Инфо
                                  </Link>
                                ),
                                mobilePriority: 3,
                              },
                            ]}
                            data={boxItems}
                            emptyMessage="В коробке нет товаров"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* --- PARAMETERS AND LOG COLUMN (5/12) --- */}
        <div className="lg:col-span-5 space-y-6">
          {/* Barcode Input */}
          <Card>
            <CardHeader className="pb-3 border-b border-[var(--card-border)]/50">
              <CardTitle className="text-base font-semibold">Поиск по коду</CardTitle>
              <CardDescription>Введите 13-значный код EAN-13 вручную</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="manualBarcode"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      placeholder="Например, 2000000000123"
                      className="bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs rounded-md block w-full px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      maxLength={13}
                      pattern="[0-9]{13}"
                    />
                    <Button type="submit" size="sm" className="px-4">Поиск</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Session Log / Scan History */}
          <Card>
            <CardHeader className="pb-2 border-b border-[var(--card-border)]/50">
              <CardTitle className="text-base font-semibold">Журнал сессии</CardTitle>
              <CardDescription>Лог операций текущего устройства</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                {scanHistory.length === 0 ? (
                  <p className="text-xs text-[var(--text-color-muted)] italic py-4 text-center">История пуста</p>
                ) : (
                  scanHistory.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleHistoryClick(item.barcode)}
                      className="w-full text-left p-2 rounded border border-[var(--card-border)] bg-[var(--background)] hover:border-indigo-500/20 transition-all flex justify-between items-center group cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[var(--text-color-primary)] group-hover:text-indigo-500 transition-colors">
                          {item.barcode}
                        </span>
                        <span className="text-[10px] text-[var(--text-color-muted)] truncate">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-color-muted)] ml-2 flex-shrink-0">
                        {item.timestamp}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technical Guide */}
          <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-xs space-y-2.5">
            <h3 className="font-semibold text-[var(--text-color-primary)] uppercase tracking-wider text-[10px]">
              Технический регламент EAN
            </h3>
            <ul className="text-[var(--text-color-secondary)] space-y-1.5 list-disc list-inside">
              <li>Помещайте код горизонтально по линии лазера.</li>
              <li>Держите объектив на расстоянии 15–20 см от объекта.</li>
              <li>Для перефокусировки нажмите на видео HUD.</li>
              <li>
                Коды <strong className="text-[var(--text-color-primary)]">200xxxxxxxxx</strong> отведены для товаров.
              </li>
              <li>
                Коды <strong className="text-[var(--text-color-primary)]">300xxxxxxxxx</strong> отведены для коробок.
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
