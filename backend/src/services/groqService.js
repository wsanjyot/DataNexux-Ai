const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SCHEMA_CONTEXT = `
You are a PostgreSQL expert. Convert the user's question into a valid PostgreSQL SELECT query.

Database schema:
- customers(id, name, email, city, state, created_at)
- products(id, name, category, price, stock, created_at)
- orders(id, customer_id, status, total, created_at)
- order_items(id, order_id, product_id, quantity, unit_price)
- monthly_sales(id, region, month, revenue, orders_count)
- website_traffic(id, date, visitors, conversions, conversion_rate)
- employees(id, name, department, salary, joined_at)
- refund_requests(id, order_id, reason, status, created_at)
- profit_loss(id, month, revenue, expenses, profit)

Rules:
1. Return ONLY the SQL query, nothing else
2. No explanations, no markdown, no backticks
3. Only SELECT statements — never INSERT, UPDATE, DELETE, DROP
4. Always include a LIMIT clause, max 100
5. Use proper PostgreSQL syntax
6. For date comparisons use NOW() and INTERVAL
7. If the user says "now filter by X" or "show only Y" — modify the previous SQL query
`;

const generateSQL = async (question, userRole, history = []) => {
  const roleContext = userRole === 'admin'
    ? 'The user is an admin and can access all tables.'
    : userRole === 'analyst'
    ? 'The user is an analyst and can access: customers, products, orders, order_items, monthly_sales, website_traffic.'
    : 'The user is a viewer and can only access: customers, products, orders.';

  const messages = [
    { role: 'system', content: SCHEMA_CONTEXT + '\n' + roleContext },
    ...history,
    { role: 'user', content: question },
  ];

  const completion = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    messages,
    temperature: 0.1,
    max_tokens:  500,
  });

  const sql = completion.choices[0].message.content.trim();

  const normalized = sql.toUpperCase().trimStart();
  if (!normalized.startsWith('SELECT')) {
    throw new Error('AI generated a non-SELECT query — blocked for safety');
  }

  return sql;
};
const generateInsights = async (question, columns, rows) => {
  if (!rows || rows.length === 0) return null;

  const sample = rows.slice(0, 10);
  const dataPreview = JSON.stringify(sample, null, 2);

  const completion = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    messages: [
      {
        role:    'system',
        content: `You are a data analyst. Given query results, provide exactly 2 short insight sentences.
Rules:
1. Maximum 2 sentences total
2. Be specific — mention actual numbers, names, or values from the data
3. No bullet points, no headers, just plain sentences
4. Focus on the most interesting pattern or finding
5. Keep it under 50 words total`,
      },
      {
        role:    'user',
        content: `Question: "${question}"\nColumns: ${columns.join(', ')}\nData: ${dataPreview}`,
      },
    ],
    temperature: 0.3,
    max_tokens:  150,
  });

  return completion.choices[0].message.content.trim();
};

module.exports = { generateSQL, generateInsights };