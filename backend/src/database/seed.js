const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT || 5432,
});

const indianCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal'
];

const indianStates = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu',
  'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh'
];

const productCategories = {
  Electronics: ['Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Smart Watch', 'Keyboard', 'Monitor'],
  Clothing:    ['Kurta', 'Saree', 'Jeans', 'T-Shirt', 'Jacket', 'Salwar Suit'],
  Furniture:   ['Office Chair', 'Study Table', 'Bookshelf', 'Sofa', 'Wardrobe'],
  Groceries:   ['Basmati Rice', 'Toor Dal', 'Sunflower Oil', 'Atta', 'Spice Kit'],
  Sports:      ['Cricket Bat', 'Football', 'Badminton Racket', 'Yoga Mat', 'Dumbbells'],
};

const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations'];
const regions     = ['North', 'South', 'East', 'West', 'Central'];
const orderStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Seeding started...');
    await client.query('BEGIN');

    // ── Users ────────────────────────────────────────────────────
    const password = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Admin User',    'admin@datanexus.com',   $1, 'admin'),
      ('Analyst User',  'analyst@datanexus.com', $1, 'analyst'),
      ('Viewer User',   'viewer@datanexus.com',  $1, 'viewer')
      ON CONFLICT (email) DO NOTHING
    `, [password]);
    console.log('Users seeded');

    // ── Customers (bulk insert 300) ───────────────────────────────
    const customerValues = [];
    const customerParams = [];
    let ci = 1;
    for (let i = 0; i < 300; i++) {
      customerValues.push(`($${ci}, $${ci+1}, $${ci+2}, $${ci+3})`);
      customerParams.push(
        faker.person.fullName(),
        faker.internet.email(),
        randomItem(indianCities),
        randomItem(indianStates)
      );
      ci += 4;
    }
    await client.query(
      `INSERT INTO customers (name, email, city, state) VALUES ${customerValues.join(',')} ON CONFLICT (email) DO NOTHING`,
      customerParams
    );
    console.log('Customers seeded');

    // ── Products ──────────────────────────────────────────────────
    const productIds = [];
    for (const [category, items] of Object.entries(productCategories)) {
      for (const item of items) {
        const res = await client.query(
          `INSERT INTO products (name, category, price, stock) VALUES ($1, $2, $3, $4) RETURNING id`,
          [item, category, randomBetween(199, 49999), randomBetween(10, 500)]
        );
        productIds.push(res.rows[0].id);
      }
    }
    console.log('Products seeded');

    // ── Orders + Order Items (100 orders to keep it fast) ─────────
    const customerRes = await client.query(`SELECT id FROM customers LIMIT 100`);
    const customerIds = customerRes.rows.map(r => r.id);

    for (let i = 0; i < 100; i++) {
      const orderRes = await client.query(
        `INSERT INTO orders (customer_id, status, total, created_at) VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          randomItem(customerIds),
          randomItem(orderStatus),
          0,
          faker.date.between({ from: '2023-01-01', to: new Date() })
        ]
      );
      const orderId = orderRes.rows[0].id;
      let total = 0;
      const itemCount = randomBetween(1, 3);
      for (let j = 0; j < itemCount; j++) {
        const productId = randomItem(productIds);
        const qty = randomBetween(1, 5);
        const productQ = await client.query(`SELECT price FROM products WHERE id=$1`, [productId]);
        const price = parseFloat(productQ.rows[0].price);
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
          [orderId, productId, qty, price]
        );
        total += qty * price;
      }
      await client.query(`UPDATE orders SET total=$1 WHERE id=$2`, [total, orderId]);
    }
    console.log('Orders seeded');

    // ── Monthly Sales ─────────────────────────────────────────────
    for (let m = 0; m < 12; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      const month = date.toISOString().slice(0, 7) + '-01';
      for (const region of regions) {
        await client.query(
          `INSERT INTO monthly_sales (region, month, revenue, orders_count) VALUES ($1, $2, $3, $4)`,
          [region, month, randomBetween(50000, 500000), randomBetween(100, 1000)]
        );
      }
    }
    console.log('Monthly sales seeded');

    // ── Website Traffic (30 days) ─────────────────────────────────
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const visitors = randomBetween(500, 5000);
      const conversions = randomBetween(10, Math.floor(visitors * 0.1));
      await client.query(
        `INSERT INTO website_traffic (date, visitors, conversions, conversion_rate) VALUES ($1, $2, $3, $4)`,
        [date.toISOString().slice(0, 10), visitors, conversions, ((conversions / visitors) * 100).toFixed(2)]
      );
    }
    console.log('Website traffic seeded');

    // ── Employees ─────────────────────────────────────────────────
    for (let i = 0; i < 20; i++) {
      await client.query(
        `INSERT INTO employees (name, department, salary, joined_at) VALUES ($1, $2, $3, $4)`,
        [faker.person.fullName(), randomItem(departments), randomBetween(30000, 200000), faker.date.between({ from: '2018-01-01', to: new Date() })]
      );
    }
    console.log('Employees seeded');

    // ── Profit Loss ───────────────────────────────────────────────
    for (let m = 0; m < 12; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      const month = date.toISOString().slice(0, 7) + '-01';
      const revenue = randomBetween(200000, 1000000);
      const expenses = randomBetween(100000, 700000);
      await client.query(
        `INSERT INTO profit_loss (month, revenue, expenses, profit) VALUES ($1, $2, $3, $4)`,
        [month, revenue, expenses, revenue - expenses]
      );
    }
    console.log('Profit loss seeded');

    await client.query('COMMIT');
    console.log('All done! Database is ready.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();