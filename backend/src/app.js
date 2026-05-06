require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://datanexus-ai-sanjyot.netlify.app',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

// ── Security middleware ───────────────────────────────────────
app.use(helmet());

// ── Rate limiter ──────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  message:  { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Body parser ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger docs ──────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DataNexus API is running' });
});

// ── Routes ────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const queryRoutes     = require('./routes/queryRoutes');
const sourcesRoutes   = require('./routes/sourcesRoutes');
const aiRoutes        = require('./routes/aiRoutes');
const schedulerRoutes = require('./routes/schedulerRoutes');
const exportRoutes    = require('./routes/exportRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/query',     queryRoutes);
app.use('/api/sources',   sourcesRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/export',    exportRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;