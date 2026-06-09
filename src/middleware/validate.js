const ApiError = require("../utils/ApiError");

/**
 * Custom, dependency-free request validation (no Zod).
 *
 * Define a schema as a map of field → rule object, then mount `validate(schema)`
 * before a handler. On failure it throws a 422 with a `details` map of
 * field → message. Validated/coerced values replace `req.body`.
 *
 * Rule options:
 *   type:      "string" | "number" | "integer" | "boolean" | "email" | "url" |
 *              "array" | "object" | "slug" | "enum" | "html"
 *   required:  boolean (default false)
 *   min/max:   number — string length, array length, or numeric bounds
 *   values:    array — allowed values for type "enum"
 *   itemType:  "string" | "number" | "object" — element type for arrays
 *   default:   value used when the field is absent
 *   trim:      boolean (default true for strings)
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function validateField(name, rawValue, rule, errors) {
  const label = rule.label || name;
  let value = rawValue;

  // Absent / empty handling.
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    if (rule.required) {
      errors[name] = `${label} is required.`;
      return undefined;
    }
    if (Object.prototype.hasOwnProperty.call(rule, "default")) return rule.default;
    return value === undefined ? undefined : value;
  }

  const type = rule.type || "string";

  switch (type) {
    case "string":
    case "html":
    case "slug": {
      if (typeof value !== "string") {
        errors[name] = `${label} must be a string.`;
        return value;
      }
      if (rule.trim !== false) value = value.trim();
      if (rule.min != null && value.length < rule.min)
        errors[name] = `${label} must be at least ${rule.min} characters.`;
      else if (rule.max != null && value.length > rule.max)
        errors[name] = `${label} must be at most ${rule.max} characters.`;
      else if (type === "slug" && !SLUG_RE.test(value))
        errors[name] = `${label} must be lowercase letters, numbers and dashes only.`;
      return value;
    }
    case "email": {
      if (typeof value !== "string" || !EMAIL_RE.test(value.trim()))
        errors[name] = `${label} must be a valid email address.`;
      return typeof value === "string" ? value.trim().toLowerCase() : value;
    }
    case "name": {
      if (typeof value !== "string") {
        errors[name] = `${label} must be text.`;
        return value;
      }
      if (rule.trim !== false) value = value.trim();
      if (rule.min != null && value.length < rule.min)
        errors[name] = `${label} must be at least ${rule.min} characters.`;
      else if (rule.max != null && value.length > rule.max)
        errors[name] = `${label} must be at most ${rule.max} characters.`;
      else if (!NAME_RE.test(value))
        errors[name] = `${label} may only contain letters and spaces.`;
      return value;
    }
    case "mobile": {
      const str = String(value).trim();
      if (!MOBILE_RE.test(str))
        errors[name] = `${label} must be a valid 10-digit mobile number starting 6–9.`;
      return str;
    }
    case "url": {
      const str = String(value).trim();
      if (str !== "#") {
        try {
          // Allow relative paths (e.g. "/contact") and absolute URLs.
          if (!str.startsWith("/")) new URL(str);
        } catch {
          errors[name] = `${label} must be a valid URL.`;
        }
      }
      return str;
    }
    case "number":
    case "integer": {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) {
        errors[name] = `${label} must be a number.`;
        return value;
      }
      if (type === "integer" && !Number.isInteger(num))
        errors[name] = `${label} must be a whole number.`;
      else if (rule.min != null && num < rule.min)
        errors[name] = `${label} must be at least ${rule.min}.`;
      else if (rule.max != null && num > rule.max)
        errors[name] = `${label} must be at most ${rule.max}.`;
      return num;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      if (value === "true" || value === 1 || value === "1") return true;
      if (value === "false" || value === 0 || value === "0") return false;
      errors[name] = `${label} must be true or false.`;
      return value;
    }
    case "enum": {
      if (!rule.values || !rule.values.includes(value))
        errors[name] = `${label} must be one of: ${(rule.values || []).join(", ")}.`;
      return value;
    }
    case "array": {
      if (!Array.isArray(value)) {
        errors[name] = `${label} must be a list.`;
        return value;
      }
      if (rule.min != null && value.length < rule.min)
        errors[name] = `${label} must have at least ${rule.min} item(s).`;
      else if (rule.max != null && value.length > rule.max)
        errors[name] = `${label} must have at most ${rule.max} item(s).`;
      else if (rule.itemType) {
        const bad = value.some((item) =>
          rule.itemType === "object" ? !isPlainObject(item) : typeof item !== rule.itemType,
        );
        if (bad) errors[name] = `${label} contains invalid items.`;
      }
      return value;
    }
    case "object": {
      if (!isPlainObject(value)) errors[name] = `${label} must be an object.`;
      return value;
    }
    default:
      return value;
  }
}

function runSchema(schema, source) {
  const errors = {};
  const out = {};
  for (const field of Object.keys(schema)) {
    const result = validateField(field, source[field], schema[field], errors);
    if (result !== undefined) out[field] = result;
  }
  return { errors, out };
}

/** Validate `req.body` against a schema; replaces body with cleaned values. */
function validate(schema) {
  return (req, res, next) => {
    const { errors, out } = runSchema(schema, req.body || {});
    if (Object.keys(errors).length) {
      return next(ApiError.validation(errors));
    }
    // Preserve any keys not described by the schema (handlers decide what to use).
    req.body = { ...req.body, ...out };
    next();
  };
}

module.exports = { validate, runSchema };
