-- seed.sql
-- Seed script for Mila ERP System Database

-- Clear existing data
TRUNCATE TABLE box_items CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE boxes CASCADE;

-- Insert products
INSERT INTO products (name, barcode, quantity, photo_paths, description, price, category) VALUES
(
    'Беспроводные наушники SoundCore Pro', 
    '2000000000015', 
    45, 
    '["/api/uploads/soundcore_headphones.png"]', 
    'Полноразмерные наушники с активным шумоподавлением, Bluetooth 5.2 и временем автономной работы до 40 часов.', 
    7990.00, 
    'Электроника'
),
(
    'Умные часы Vector Watch X', 
    '2000000000022', 
    30, 
    '["/api/uploads/vector_watch.png"]', 
    'Смарт-часы с ярким AMOLED-экраном, датчиком уровня кислорода в крови, пульсометром и влагозащитой IP68.', 
    12490.00, 
    'Электроника'
),
(
    'Электрический чайник SteelGlow 1.7L', 
    '2000000000039', 
    15, 
    '["/api/uploads/steelglow_kettle.png"]', 
    'Чайник из высококачественной нержавеющей стали с точной регулировкой температуры, сенсорным управлением и двойными стенками.', 
    4290.00, 
    'Бытовая техника'
),
(
    'Рюкзак городской Urban Leather', 
    '2000000000046', 
    20, 
    '["/api/uploads/urban_backpack.png"]', 
    'Стильный городской рюкзак из натуральной кожи с мягким отделением для ноутбука 15.6 дюймов и системой скрытых карманов.', 
    8900.00, 
    'Аксессуары'
),
(
    'Механическая клавиатура KeyClick Neo', 
    '2000000000053', 
    25, 
    '["/api/uploads/keyclick_keyboard.png"]', 
    'Компактная механическая клавиатура (формат 75%) на смазанных линейных переключателях с настраиваемой RGB-подсветкой и поддержкой hot-swap.', 
    6500.00, 
    'Компьютерная периферия'
),
(
    'Термос дорожный Explorer 1.0L', 
    '2000000000060', 
    60, 
    '["/api/uploads/explorer_thermos.png"]', 
    'Вакуумный дорожный термос из долговечной пищевой стали. Сохраняет напитки горячими до 24 часов. В комплекте две чашки.', 
    1890.00, 
    'Туризм'
);

-- Insert boxes
INSERT INTO boxes (id, name, barcode) VALUES
(1, 'Коробка Электроники A1', '3000000000014'),
(2, 'Коробка Периферии B2', '3000000000021'),
(3, 'Коробка Туризма C3', '3000000000038');

-- Reset sequence for boxes id to ensure next manual insertions don't conflict
SELECT setval('boxes_id_seq', (SELECT MAX(id) FROM boxes));

-- Insert items into boxes
-- Box 1 items
INSERT INTO box_items (box_id, product_id, quantity) VALUES
(1, (SELECT id FROM products WHERE barcode = '2000000000015'), 2), -- 2 Headphones in Box 1
(1, (SELECT id FROM products WHERE barcode = '2000000000022'), 1); -- 1 Watch in Box 1

-- Box 2 items
INSERT INTO box_items (box_id, product_id, quantity) VALUES
(2, (SELECT id FROM products WHERE barcode = '2000000000053'), 3); -- 3 Keyboards in Box 2

-- Box 3 items
INSERT INTO box_items (box_id, product_id, quantity) VALUES
(3, (SELECT id FROM products WHERE barcode = '2000000000060'), 2), -- 2 Thermoses in Box 3
(3, (SELECT id FROM products WHERE barcode = '2000000000039'), 1); -- 1 Kettle in Box 3
