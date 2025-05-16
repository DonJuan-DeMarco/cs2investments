-- Insert sample CS2 investments
INSERT INTO investments (
  name, 
  image_url, 
  purchase_date, 
  purchase_price, 
  current_price, 
  quantity, 
  total_investment, 
  total_current_value
) VALUES 
(
  'AWP | Asiimov (Field-Tested)',
  'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2G9SupUijOjAotyg3w2x_0ZkZ2rzd4KQdQRoYQuE8gDtyL_mg5K4tJ-amzB9sXYl5iuK',
  '2025-01-15',
  90.50,
  95.75,
  2,
  181.00,
  191.50
),
(
  'AK-47 | Redline (Field-Tested)',
  'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdsZGHyd4_Bd1RvNQ7T_FDrw-_tgpa_6snKyXpivygi5nrD30vgUOr9WuY',
  '2024-11-25',
  15.20,
  18.45,
  5,
  76.00,
  92.25
),
(
  'M4A4 | Neo-Noir (Minimal Wear)',
  'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwW09-vloWZh-L6OITdn2xZ_Pp9i_vG8ML03QO2_BY_YW6mcNKTJFRraViG8gK_xr3sg5-5uJWbzSBjvyQqtHbemQv3308y1HnQmA',
  '2025-02-10',
  25.60,
  23.10,
  3,
  76.80,
  69.30
),
(
  'Butterfly Knife | Fade (Factory New)',
  'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GGqPP7I6vdk3lu-M1wmeyQyoD8j1yg5RVtMmCmctOWdlI-YV_Xqwe3x1G-78i_ISGwuj5iuyhP3-x2Fw',
  '2025-03-01',
  890.00,
  950.50,
  1,
  890.00,
  950.50
);

-- Insert sample price history entries
INSERT INTO price_history (
  item_id,
  price,
  date
) 
SELECT 
  id, 
  purchase_price, 
  purchase_date 
FROM investments;

-- Add some additional price history points
INSERT INTO price_history (
  item_id,
  price,
  date
)
SELECT 
  id, 
  current_price, 
  NOW() 
FROM investments;

-- Add more price points for the Asiimov to simulate a history
WITH asiimov AS (
  SELECT id FROM investments WHERE name LIKE '%Asiimov%' LIMIT 1
)
INSERT INTO price_history (
  item_id,
  price,
  date
) VALUES
(
  (SELECT id FROM asiimov),
  91.25,
  NOW() - INTERVAL '5 days'
),
(
  (SELECT id FROM asiimov),
  92.80,
  NOW() - INTERVAL '4 days'
),
(
  (SELECT id FROM asiimov),
  94.35,
  NOW() - INTERVAL '3 days'
),
(
  (SELECT id FROM asiimov),
  94.90,
  NOW() - INTERVAL '2 days'
),
(
  (SELECT id FROM asiimov),
  95.75,
  NOW() - INTERVAL '1 day'
); 