"use client";
import React, { useState } from "react";
import { H1 } from "@/components/Typography";
import BarcodeScanner from "@/components/Barcode";

export default function ScanPage() {
  const [scannedCode, setScannedCode] = useState("");
  return (
    <div className="max-w-md mx-auto space-y-6">
      <H1>Сканер штрих-кодов</H1>
      <BarcodeScanner onDetected={(code) => setScannedCode(code)} />
      {scannedCode && (
        <div className="p-4 bg-muted rounded border">
          Просканировано: <strong>{scannedCode}</strong>
        </div>
      )}
    </div>
  );
}
