const { ALLOWED_TABLES } = require('../services/queryEngine');

const getSources = async (req, res) => {
  try {
    const role    = req.user.role;
    const tables  = ALLOWED_TABLES[role] || [];

    const sources = [
      {
        id:          'store',
        name:        'Store DB',
        description: 'Customers, products, orders and order items',
        tables:      ['customers', 'products', 'orders', 'order_items'].filter(t => tables.includes(t)),
      },
      {
        id:          'analytics',
        name:        'Analytics DB',
        description: 'Monthly sales by region and website traffic',
        tables:      ['monthly_sales', 'website_traffic'].filter(t => tables.includes(t)),
      },
      {
        id:          'admin',
        name:        'Admin DB',
        description: 'Employees, refunds and profit/loss financials',
        tables:      ['employees', 'refund_requests', 'profit_loss'].filter(t => tables.includes(t)),
      },
    ].filter(source => source.tables.length > 0);

    res.json({
      role,
      sources,
    });
  } catch (err) {
    console.error('Sources error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getSources };