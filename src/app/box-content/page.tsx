import { Suspense } from "react";
import BoxContentClient from "@/components/BoxContentClient";

export const metadata = {
  title: "Содержимое коробки",
  description: "Управление содержимым коробки",
};

export default function BoxContentPage() {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      }
    >
      <BoxContentClient />
    </Suspense>
  );
}
