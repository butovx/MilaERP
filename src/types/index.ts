export interface Product {
  id: number;
  name: string;
  barcode: string;
  photo_paths?: string[];
  quantity?: number;
  description?: string;
  price?: number;
  category?: string;
  sales_channels?: string[];
  delivery_methods?: string[];
  boxes?: Box[];
}

export interface Box {
  id: number;
  name: string;
  barcode: string;
  created_at?: string;
  items_count?: number;
  total_price?: number;
}

export interface BoxItem extends Product {
  quantity: number;
  product_id: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Add types for the global window object
declare global {
  interface Window {
    __THEME_RESOLVED?: "light" | "dark";
    Quagga: any;
  }
}
