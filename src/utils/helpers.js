const sanitizeHtmlLib = require("sanitize-html");

/** URL-safe slug from a title. */
function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Parse a route param into a BigInt id, throwing a clean 400 on garbage input. */
function parseId(value) {
  if (!/^\d+$/.test(String(value))) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

/** Estimated reading time from HTML content. */
function readingTime(html) {
  const text = String(html || "").replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** Sanitize rich-text HTML produced by the admin editor (prevents stored XSS). */
function sanitizeRichText(html) {
  if (!html) return "";
  return sanitizeHtmlLib(String(html), {
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "figure",
      "figcaption",
    ]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "name", "target", "rel"],
      "*": ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
  });
}

/** Strip all tags — for plain-text fields that should never contain HTML. */
function stripTags(value) {
  return String(value ?? "").replace(/<[^>]*>/g, "").trim();
}

module.exports = { slugify, parseId, readingTime, sanitizeRichText, stripTags };
