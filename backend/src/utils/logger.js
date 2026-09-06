function serializeError(error) {
  if (!error) return undefined;
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  };
}

function log(level, message, meta = {}) {
  const record = {
    time: new Date().toISOString(),
    level,
    service: 'flowly-api',
    message,
    ...meta
  };
  if (record.error instanceof Error) record.error = serializeError(record.error);
  const line = JSON.stringify(record);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta)
};
