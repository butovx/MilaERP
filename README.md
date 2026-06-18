# 📦 Mila ERP System

Mila ERP is a next-generation, high-performance warehouse and enterprise resource planning system. Built with **Next.js 15**, **React 19**, **TypeScript**, and **PostgreSQL**, it features a cutting-edge, minimal, and highly technological design system that supports responsive adaptive sizing and instant light/dark mode toggling.

---

## ✨ Features

* **📦 Smart Inventory & Box Management**: Create and track storage boxes, monitor contents dynamically, generate printable EAN-13 barcodes, and query box contents instantly.
* **🏷️ Product Directory**: Add and edit products, categorize, assign pricing, attach photos, and manage stock quantities with advanced selection and batch actions.
* **📱 High-Tech Barcode Scanner**: Scan barcodes in real-time using a custom-designed HUD grayscale video overlay featuring a laser line guide and a terminal-style scan logs viewer. Supports EAN-13 validation (e.g., prefix `200` for boxes, `300` for products) and manual inputs.
* **🔍 Advanced Search, Filtering & Sorting**: Server-side paginated queries, instant category filters, and sorting parameters (ID, Name, Quantity, Price, Date) for large scale inventory.
* **📊 Analytics Dashboard**: Beautiful stats grid widgets, quick-access operation controls, and a responsive **Recharts Area Graph** styled to match the active system theme.

---

## 🎨 Design System

Mila ERP has been overhauled with a modern, premium **Minimalist & Technological Design**:
* **🌗 Adaptive Dark & Light Modes**: Implemented via a custom React `ThemeProvider` and class-based Tailwind variables for seamless styling transitions.
* **⚡ Tech Aesthetics**: Subtle glowing cyan and indigo accents, interactive borders, glassmorphic card overlays, and smooth micro-animations.
* **📱 Collapsible Navigation Sidebar**: Left-aligned desktop sidebar and bottom/top drawer mobile navigation with smooth toggle actions.
* **✒️ Premium Typography**: Standard fonts replaced by **Inter** for clean readability across dark and light interfaces.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, HeadlessUI, Framer Motion |
| **Charts & Alerts** | Recharts, Radix UI Toaster |
| **Barcode Scanner** | QuaggaJS (camera scanner), BWIP-JS (barcode generator) |
| **Backend & Database** | Next.js API Routes, PostgreSQL, node-postgres (`pg`) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.x` or higher
* **PostgreSQL**: `v14.x` or higher
* **Package Manager**: `npm` or `yarn`

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/butovx/milaerp.git
   cd milaerp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to supply your database URL and credentials.*

4. **Prepare Database Schemas**:
   ```bash
   # Initialize tables and push modifications
   npx prisma db push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
src/
├── app/                    # Next.js App Router directories
│   ├── api/                # Backend API route handlers
│   ├── boxes/              # Box management page
│   ├── products/           # Product directory page with filtering/pagination
│   └── scan/               # Tech HUD camera scanner page
├── components/             # Reusable UI components (Card, Button, DataTable, etc.)
│   ├── product/            # Product detail display components
│   └── ui/                 # Basic UI blocks (radix-based widgets)
├── hooks/                  # Custom react hooks (toaster, etc.)
├── lib/                    # Helper configurations (db connector, uploads handler)
├── utils/                  # Styling & helper utilities (cn class merge, etc.)
└── types/                  # Shared TypeScript typings
```

---

## 🔌 API Reference

### Products API
* `GET /api/products` — Retrieve paginated list of products (supports search, category, sort, and pagination query params).
* `GET /api/products/[id]` — Get single product details.
* `GET /api/products/barcode/[code]` — Query product by EAN-13 barcode.
* `POST /api/products` — Create new product with multipart photo uploads.
* `PUT /api/products/[id]` — Edit product details and images.
* `DELETE /api/products/[id]` — Remove product.

### Boxes API
* `GET /api/boxes` — List all boxes.
* `GET /api/boxes/[id]` — Get details and contents of a box.
* `GET /api/boxes/barcode/[code]` — Get box by barcode.
* `POST /api/boxes` — Create box.
* `DELETE /api/boxes/[id]` — Delete box.

### Box Items API
* `POST /api/box-items` — Add items to a box.
* `DELETE /api/box-items/[boxId]/[productId]` — Remove item from a box.

---

## 🤝 Contributing

1. Fork the project.
2. Create a branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m "feat: add some amazing feature"`.
4. Push to branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
