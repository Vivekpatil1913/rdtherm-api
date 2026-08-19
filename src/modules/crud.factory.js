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
 *   positioned      true → the resource exposes a 1-based `order` (sequence) the
 *                   admin can set directly on create/update. Positions stay
 *                   contiguous: inserting at 2 pushes the old 2 down to 3, and
 *                   deleting closes the gap.
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
    // Opt in to admin-settable sequence numbers (see `positioned` above).
    positioned = false,
  } = config;

  const delegate = prisma[model];
  const router = express.Router();
  router.use(requireAuth);

  const listOmitObj = listOmit.length ? Object.fromEntries(listOmit.map((f) => [f, true])) : undefined;

  const fullSortMap = { order: "sortOrder", createdAt: "createdAt", updatedAt: "updatedAt", ...sortMap };

  // sortOrder is 0-based in the DB; a "sequence" is what a human types, so the
  // API speaks 1-based positions and converts at the boundary.
  const mapOut = positioned
    ? (r) => ({ ...toResponse(r), order: (r.sortOrder ?? 0) + 1 })
    : toResponse;

  /** Live records with their current position, in sequence order. */
  function liveInOrder() {
    return delegate.findMany({
      where: { isDeleted: false },
      // id breaks ties so the sequence is stable when several rows share a
      // sortOrder (legacy rows created before this resource was positioned).
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, sortOrder: true },
    });
  }

  /** Persist `rows` in the given array order, touching only what moved. */
  async function renumber(rows) {
    const writes = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row, index }) => row.sortOrder !== index)
      .map(({ row, index }) => delegate.update({ where: { id: row.id }, data: { sortOrder: index } }));
    if (writes.length) await prisma.$transaction(writes);
  }

  /**
   * Reject a sequence the admin could not have meant. On create there is one
   * extra slot (the new tail); on update the record already occupies one.
   */
  function assertPosition(position, count, mode) {
    const max = mode === "create" ? count + 1 : Math.max(count, 1);
    if (!Number.isInteger(position) || position < 1 || position > max) {
      throw ApiError.validation({
        order:
          max === 1
            ? "Sequence must be 1 — this is the only entry."
            : `Sequence must be a whole number between 1 and ${max}.`,
      });
    }
  }

  /** Requested sequence off the request body, or null when left blank. */
  function requestedPosition(body) {
    if (!positioned) return null;
    const raw = body ? body.order : undefined;
    if (raw === undefined || raw === null || raw === "") return null;
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      throw ApiError.validation({ order: "Sequence must be a whole number." });
    }
    return num;
  }

  /** Move one record to a 1-based position, resequencing everything around it. */
  async function applyPosition(id, position) {
    const rows = await liveInOrder();
    const moving = rows.find((r) => String(r.id) === String(id));
    if (!moving) return;
    const rest = rows.filter((r) => String(r.id) !== String(id));
    const index = Math.min(Math.max(position - 1, 0), rest.length);
    rest.splice(index, 0, moving);
    await renumber(rest);
  }

  /** Close the gaps a delete leaves behind so sequences stay 1..n. */
  async function compactPositions() {
    if (!positioned) return;
    await renumber(await liveInOrder());
  }

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
      // Humanize the internal column (key/slug) so the message reads naturally.
      const FRIENDLY = { key: "name", slug: "name", label: "name", author: "name", email: "email address", phone: "phone number" };
      const label = FRIENDLY[uniqueField] || uniqueField;
      // Field-mapped validation error so the admin surfaces it inline on that field.
      throw ApiError.validation({
        [uniqueField]: `This ${label} is already used by another ${singular.toLowerCase()}. Please enter a different one.`,
      });
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

      return paginated(res, rows.map(mapOut), { total, page, pageSize });
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
      return ok(res, rows.map(mapOut));
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
      await compactPositions();
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
      return ok(res, mapOut(record));
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
      // Check the sequence before writing anything, so a bad value cannot
      // leave a half-created record behind.
      const wanted = requestedPosition(req.body);
      if (wanted !== null) {
        assertPosition(wanted, await delegate.count({ where: { isDeleted: false } }), "create");
      }
      if (data.sortOrder === undefined) {
        const max = await delegate.aggregate({ _max: { sortOrder: true } });
        data.sortOrder = (max._max.sortOrder ?? -1) + 1;
      }
      let record = await delegate.create({ data, include });
      // Created at the tail first, then moved — one code path for every insert.
      if (wanted !== null) {
        await applyPosition(record.id, wanted);
        record = await delegate.findFirst({ where: { id: record.id }, include });
      }
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: "created", target: labelOf(record, singular), module: moduleName });
      return created(res, mapOut(record));
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
      const wanted = requestedPosition(req.body);
      if (wanted !== null) {
        assertPosition(wanted, await delegate.count({ where: { isDeleted: false } }), "update");
      }
      let record = await delegate.update({ where: { id }, data, include });
      if (wanted !== null) {
        await applyPosition(id, wanted);
        record = await delegate.findFirst({ where: { id }, include });
      }
      await logActivity({ actor: req.user.name, actorId: req.user.id, action: "updated", target: labelOf(record, singular), module: moduleName });
      return ok(res, mapOut(record));
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
      return ok(res, mapOut(record));
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
      await compactPositions();
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
