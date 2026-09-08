function escapeHtml(value) {
  if (typeof value !== 'string') return value;
  return value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (key.toLowerCase().includes('password')) continue;
      req.body[key] = escapeHtml(req.body[key]);
    }
  }
  next();
}

module.exports = { sanitizeBody, escapeHtml };
