# MILA ERP

## Description

MILA ERP is an enterprise resource planning (ERP) system designed for small and medium-sized businesses. It automates warehouse management, sales, procurement, and finance processes.

## Key Features

- Warehouse Management:
  - Adding and tracking products
  - Managing boxes and packages
  - Scanning barcodes
- Sales Management:
  - Creating and tracking orders
  - Issuing invoices
- Procurement Management:
  - Generating purchase requests
  - Tracking deliveries
- Financial Management:
  - Tracking income and expenses
  - Generating reports

## Technologies

- Node.js
- Express
- PostgreSQL
- jsbarcode
- QuaggaJS
- HTML
- CSS
- JavaScript
- Font Awesome

## Installation

1.  Install PostgreSQL and create a database for the project.

2.  Clone the repository:

    ```bash
    git clone https://github.com/butovx/MilaERP.git
    ```

3.  Navigate to the project directory:

    ```bash
    cd MilaERP
    ```

4.  Install dependencies:

    ```bash
    npm install
    ```

5.  Configure the database connection. Create a `.env` file in the project root and specify the following variables:

    ```
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=your_db_name
    ```

    Or configure the connection directly in `db.js`.

6.  Start the server:

    ```bash
    npm start
    ```

## Usage

1.  **Add Product:** Go to `/index.html` to add a new product, specifying the name and quantity.
2.  **Product List:** Go to `/products.html` to view a list of all products with their ID, names, quantity, and barcodes.
3.  **Barcode Scanning:** Use the `/scan.html` page to scan a product's barcode using the camera.
4.  **Box Management:** Go to the `/boxes.html` page to create new boxes, add products to boxes, and view box contents.

## Functionality

- Adding products with automatic generation of unique barcodes.
- Viewing a list of products with filtering and search capabilities.
- Scanning barcodes for quick product information retrieval.
- Creating and managing boxes for product storage.
- Adding products to boxes with quantity specification.
- Viewing box contents.
- Generating barcodes in EAN13 format.

## Project Structure

- `public/`: Static files (HTML, CSS, JavaScript).
  - `index.html`: Form for adding a product.
  - `products.html`: Product list.
  - `scan.html`: Barcode scanning page.
  - `boxes.html`: Box management page.
  - `box-content.html`: Page for viewing box contents.
  - `css/`: CSS styles.
  - `js/`: JavaScript scripts.
- `server.js`: Main server file on Node.js using Express.
- `db.js`: File for connecting to the PostgreSQL database.
- `package.json`: File with project information and dependencies.

## Dependencies

- `body-parser`: Middleware for handling request bodies.
- `canvas`: Node.js canvas API for generating barcode images.
- `dotenv`: Loading environment variables from the `.env` file.
- `ean13-lib`: Library for generating EAN13 barcodes.
- `express`: Framework for creating web applications on Node.js.
- `jsbarcode`: Library for generating barcodes on canvas.
- `pg`: PostgreSQL client for Node.js.

## License

ISC
