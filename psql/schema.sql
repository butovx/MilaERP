-- schema.sql
-- Mila ERP System Database Schema

-- Drop tables if they already exist (for recreation)
DROP TABLE IF EXISTS box_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS boxes;

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(13) UNIQUE NOT NULL,
    quantity INTEGER DEFAULT 0,
    photo_paths TEXT DEFAULT '[]',
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(100),
    sales_channels TEXT[] DEFAULT '{}'::text[] NOT NULL,
    delivery_methods TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create boxes table
CREATE TABLE boxes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(13) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for relationship between boxes and products
CREATE TABLE box_items (
    box_id INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (box_id, product_id)
);

-- Index for fast search of products by barcode
CREATE INDEX idx_products_barcode ON products(barcode);

-- Index for fast search of boxes by barcode
CREATE INDEX idx_boxes_barcode ON boxes(barcode);

-- Index for search of products by name
CREATE INDEX idx_products_name ON products(LOWER(name));

-- Index for search of products by category
CREATE INDEX idx_products_category ON products(category);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boxes_updated_at
BEFORE UPDATE ON boxes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_box_items_updated_at
BEFORE UPDATE ON box_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();