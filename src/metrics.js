const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'playsafe_' });

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Latência dos pedidos HTTP',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

function metricsMiddleware(skipPaths = ['/metrics', '/api/metrics']) {
  return (req, res, next) => {
    if (skipPaths.includes(req.path)) return next();
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const dur = Number(process.hrtime.bigint() - start) / 1e9;
      const route = (req.route && req.route.path) || req.path || 'unknown';
      httpDuration.labels(req.method, route, res.statusCode).observe(dur);
    });
    next();
  };
}

function setupMetrics(app) {
  app.use(metricsMiddleware());

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.get('/api/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}

module.exports = { setupMetrics, register };