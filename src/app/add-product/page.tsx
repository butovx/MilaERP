"use client";
import React, { useState } from "react";
import { H1 } from "@/components/Typography";
import { Button } from "@/components/ui/button";

export default function AddProductPage() {
  const [name, setName] = useState("");
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <H1>Добавить новый товар</H1>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Название товара</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full p-2 border rounded"
          />
        </div>
        <Button type="submit">Создать</Button>
      </form>
    </div>
  );
}
