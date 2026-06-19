import { Suspense } from "react";
import ProductDisplay from "@/components/product/ProductDisplay";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Use await to access params
  const id = (await params).id;

  return (
    <Suspense
      fallback={
        <div className="py-8 text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      }
    >
      <ProductDisplay productId={id} />
    </Suspense>
  );
}
