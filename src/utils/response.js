/**
 * Uniform success envelopes. Every endpoint returns `{ success: true, ... }`;
 * errors are emitted by the centralized error handler as `{ success: false, error }`.
 */

function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

function noContent(res) {
  return res.status(204).send();
}

/**
 * Paginated list response — matches the admin panel's ListResult contract:
 * { items, total, page, pageSize, totalPages }.
 */
function paginated(res, items, { total, page, pageSize }) {
  return res.status(200).json({
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}

module.exports = { ok, created, noContent, paginated };
