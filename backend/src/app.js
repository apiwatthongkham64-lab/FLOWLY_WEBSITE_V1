const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const routes = require('./routes');
const { requestId } = require('./middleware/requestId');
const { requestLogger } = require('./middleware/requestLogger');
const { sanitizeInput } = require('./middleware/validate');
const { csrfGuard } = require('./middleware/csrfGuard');
const { rateLimit } = require('./middleware/rateLimit');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', 1);

app.use(requestId);
app.use(requestLogger);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' }
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === env.frontendOrigin) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));
app.use(rateLimit({ windowMs: 60_000, max: env.globalRateLimitMax, keyPrefix: 'global' }));
app.use(express.json({ limit: env.jsonLimit, strict: true }));
app.use(express.urlencoded({ extended: false, limit: env.jsonLimit }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(csrfGuard);

app.get('/', (_req, res) => res.json({ ok: true, service: 'FLOWLY API', version: '2.36.0', docs: `${env.apiPrefix}/health` }));
app.use(env.apiPrefix, routes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
