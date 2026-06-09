const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, paginated, noContent } = require("../utils/response");
const { parseId } = require("../utils/helpers");
const { logActivity } = require("../utils/audit");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

/**
 * Build a fully-featured CRUD router for a Prisma model.
 *
 * Supported routes (all require auth):
 *   GET    /            list (search, filter, status, sort, paginate)
 *   GET    /:id         single
 *   POST   /            create
 *   PUT    /:id         update
 *   PATCH  /:id/status  set status (powers the active toggle)
 *   PATCH  /reorder     set sort order from an ordered id list (drag & drop)
 *   POST   /bulk-delete delete many by id
 *   DELETE /:id         delete
 *
 * config:
 *   model           Prisma delegate name (e.g. "blogPost")
 *   singular        label used in audit logs / messages
 *   module          audit module label
 *   searchFields    [dbField] scanned by ?search=
 *   filters         { queryKey: dbField } exact-match filters
 *   statusField     field used by ?status= (default "status")
 *   sortMap         { adminSortKey: dbField } (default key "order" → "sortOrder")
 *   include         Prisma include
 *   toResponse(r)   map a DB record to the API/admin shape
 *   toCreate(body)  map request body to Prisma create data
 *   toUpdate(body)  map request body to Prisma update data
 *   createSchema    validation schema for POST
 *   updateSchema    validation schema for PUT
 */
function createCrudRouter(config) {
  const {
    model,
    singular,
    module: moduleName,
    searchFields = [],
    filters = {},
    // Optional field that the ?status= query maps to (e.g. leads → "leadStatus").
    statusField = null,
    sortMap = {},
    include,
    toResponse = (r) => r,
    toCreate = (b) => b,
    toUpdate = (b) => b,
    createSchema,
    updateSchema,
    // Field whose value must be unique among non-deleted records (slug / key).
    uniqueField = null,
    // Heavy scalar fields (e.g. LongText "content") excluded from LIST responses
    // for fast, lightweight payloads at scale. Still returned by GET /:id.
    listOmit = [],
  } = config;

  const delegate = prisma[model];
  const router = express.Router();
  router.use(requireAuth);

  const listOmitObj = listOmit.length ? Object.fromEntries(listOmit.map((f) => [f, true])) : undefined;

  const fullSortMap = { order: "sortOrder", createdAt: "createdAt", updatedAt: "updatedAt", ...sortMap };

  /** Throw 409 if another *non-deleted* record already uses this unique value. */
  async function assertUnique(value, exceptId) {
    if (!uniqueField || value === undefined || value === null || value === "") return;
    const clash = await delegate.findFirst({
      where: {
        [uniqueField]: value,
        isDeleted: false,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      throw ApiError.conflict(`A ${singular.toLowerCase()} with this ${uniqueField} already exists.`, { field: uniqueField });
    }
  }

  // ── List ──────────────────────────────────────────────
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "10", 10) || 10));
      const search = (req.query.search || "").trim();
      const status = (req.query.status || "all").trim();
      const active = (req.query.active || "").trim();
      const sortBy = (req.query.sortBy || "").trim();
      const sortDir = req.query.sortDir === "desc" ? "desc" : "asc";

      const where = {};
      // Never return soft-deleted records.
      const AND = [{ isDeleted: false }];

      if (search && searchFields.length) {
        AND.push({ OR: searchFields.map((f) => ({ [f]: { contains: search } })) });
      }
      // ?status= maps to a configured string field (e.g. leads → leadStatus).
      if (statusField && status && status !== "all") {
        AND.push({ [statusField]: status });
      }
      // ?active=1|0|true|false filters the boolean is_active column.
      if (active === "1" || active === "true") AND.push({ isActive: true });
      else if (active === "0" || active === "false") AND.push({ isActive: false });
      for (const [queryKey, dbField] of Object.entries(filters)) {
        const val = (req.query[queryKey] || "").trim();
        if (val && val !== "all") AND.push({ [dbField]: val });
      }
      if (AND.length) where.AND = AND;

      const orderBy = fullSortMap[sortBy]
        ? { [fullSortMap[sortBy]]: sortDir }
        : { sortOrder: "asc" };

      const [rows, total] = await Promise.all([
        delegate.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include, omit: listOmitObj }),
        delegate.count({ where }),
      ]);

      return paginated(res, rows.map(toResponse), { total, page, pageSize });
    }),
  );

  // ── Reorder (must precede "/:id") ─────────────────────
  router.patch(
    "/reorder",
    asyncHandler(async (req, res) => {
      const ids = Array.isArray(req.body.ids) ? req.body.ids : null;
      if (!ids || !ids.length) throw ApiError.badRequest("`ids` must be a non-empty array.");
      const parsed = ids.map(parseId);
      if (parsed.some((x) => x === null)) throw ApiError.badRequest("`ids` contains invalid values.");

      await prisma.$transaction(
        parsed.map((id, index) =>
          delegate.update({ where: { id }, data: { sortOrder: index } }),
        ),
      );
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: "reordered", target: `${singular} list`, module: moduleName });

      const rows = await delegate.findMany({ where: { isDeleted: false }, orderBy: { sortOrder: "asc" }, include });
      return ok(res, rows.map(toResponse));
    }),
  );

  // ── Bulk delete (soft) ────────────────────────────────
  router.post(
    "/bulk-delete",
    asyncHandler(async (req, res) => {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map(parseId).filter(Boolean) : [];
      if (!ids.length) throw ApiError.badRequest("`ids` must be a non-empty array.");
      const result = await delegate.updateMany({
        where: { id: { in: ids }, isDeleted: false },
        data: { isDeleted: true, isActive: false },
      });
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: "deleted", target: `${result.count} ${singular}(s)`, module: moduleName });
      return ok(res, { deleted: result.count });
    }),
  );

  // ── Get one ───────────────────────────────────────────
  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) throw ApiError.badRequest("Invalid id.");
      const record = await delegate.findFirst({ where: { id, isDeleted: false }, include });
      if (!record) throw ApiError.notFound(`${singular} not found.`);
      return ok(res, toResponse(record));
    }),
  );

  // ── Create ────────────────────────────────────────────
  const createMw = createSchema ? [validate(createSchema)] : [];
  router.post(
    "/",
    ...createMw,
    asyncHandler(async (req, res) => {
      const data = await toCreate(req.body, req);
      await assertUnique(data[uniqueField]);
      if (data.sortOrder === undefined) {
        const max = await delegate.aggregate({ _max: { sortOrder: true } });
        data.sortOrder = (max._max.sortOrder ?? -1) + 1;
      }
      const record = await delegate.create({ data, include });
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: "created", target: labelOf(record, singular), module: moduleName });
      return created(res, toResponse(record));
    }),
  );

  // ── Update ────────────────────────────────────────────
  const updateMw = updateSchema ? [validate(updateSchema)] : [];
  router.put(
    "/:id",
    ...updateMw,
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) throw ApiError.badRequest("Invalid id.");
      const existing = await delegate.findFirst({ where: { id, isDeleted: false }, include });
      if (!existing) throw ApiError.notFound(`${singular} not found.`);
      const data = await toUpdate(req.body, req, existing);
      await assertUnique(data[uniqueField], id);
      const record = await delegate.update({ where: { id }, data, include });
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: "updated", target: labelOf(record, singular), module: moduleName });
      return ok(res, toResponse(record));
    }),
  );

  // ── Set active state (is_active 1/0) ──────────────────
  router.patch(
    "/:id/active",
    validate({ isActive: { type: "boolean", required: true, label: "Active" } }),
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) throw ApiError.badRequest("Invalid id.");
      const existing = await delegate.findFirst({ where: { id, isDeleted: false }, select: { id: true } });
      if (!existing) throw ApiError.notFound(`${singular} not found.`);
      const record = await delegate.update({ where: { id }, data: { isActive: req.body.isActive }, include });
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: req.body.isActive ? "activated" : "deactivated", target: labelOf(record, singular), module: moduleName });
      return ok(res, toResponse(record));
    }),
  );

  // ── Delete (soft: is_deleted = 1, is_active = 0) ──────
  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) throw ApiError.badRequest("Invalid id.");
      const existing = await delegate.findFirst({ where: { id, isDeleted: false } });
      if (!existing) throw ApiError.notFound(`${singular} not found.`);
      await delegate.update({ where: { id }, data: { isDeleted: true, isActive: false } });
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: "deleted", target: labelOf(existing, singular), module: moduleName });
      return noContent(res);
    }),
  );

  return router;
}

function labelOf(record, singular) {
  return record.title || record.name || record.question || record.author || record.label || singular;
}

module.exports = { createCrudRouter };
