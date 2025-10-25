CREATE TABLE daycare (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(150)
);

CREATE TABLE classroom (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    daycare_id INT REFERENCES daycare(id) ON DELETE CASCADE
);

CREATE TABLE parent (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150)
);

CREATE TABLE child (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    classroom_id INT REFERENCES classroom(id) ON DELETE SET NULL,
    daycare_id INT REFERENCES daycare(id) ON DELETE CASCADE
);

CREATE TABLE enrollment (
    id SERIAL PRIMARY KEY,
    child_id INT REFERENCES child(id) ON DELETE CASCADE,
    parent_id INT REFERENCES parent(id) ON DELETE CASCADE
);

-- ========================================
-- 1️⃣  Insert data into daycare
-- ========================================
INSERT INTO daycare (name, address, phone, email)
VALUES
('Happy Kids Daycare', '123 Rainbow Street', '555-111-2222', 'contact@happykids.com'),
('Little Stars Academy', '45 Sunshine Ave', '555-333-4444', 'info@littlestars.com');

-- ========================================
-- 2️⃣  Insert data into classroom
-- ========================================
INSERT INTO classroom (name, daycare_id)
VALUES
('Blue Butterflies', 1),
('Red Rockets', 1),
('Green Giraffes', 2),
('Yellow Lions', 2);

-- ========================================
-- 3️⃣  Insert data into parents
-- ========================================
INSERT INTO parent (name, phone, email)
VALUES
('Alice Johnson', '555-123-4567', 'alice.johnson@email.com'),
('Brian Smith', '555-234-5678', 'brian.smith@email.com'),
('Catherine Lee', '555-345-6789', 'catherine.lee@email.com'),
('David Brown', '555-456-7890', 'david.brown@email.com');

-- ========================================
-- 4️⃣  Insert data into children
-- ========================================
INSERT INTO child (name, date_of_birth, classroom_id, daycare_id)
VALUES
('Emily Johnson', '2020-05-12', 1, 1),
('Liam Smith', '2019-08-03', 2, 1),
('Olivia Lee', '2021-02-25', 3, 2),
('Noah Brown', '2020-11-17', 4, 2),
('Sophia Smith', '2022-01-30', 2, 1);

-- ========================================
-- 5️⃣  Insert data into enrollment (linking parents and children)
-- ========================================
INSERT INTO enrollment (child_id, parent_id)
VALUES
(1, 1),  -- Emily Johnson → Alice Johnson
(2, 2),  -- Liam Smith → Brian Smith
(3, 3),  -- Olivia Lee → Catherine Lee
(4, 4),  -- Noah Brown → David Brown
(5, 2);  -- Sophia Smith → Brian Smith (same parent as Liam)
