"use client";
import React from "react";
import { H1 } from "@/components/Typography";

export default function ScanPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <H1>Сканер штрих-кодов</H1>
      <div className="aspect-video bg-black rounded flex items-center justify-center text-white">
        Камера не подключена
      </div>
    </div>
  );
}
