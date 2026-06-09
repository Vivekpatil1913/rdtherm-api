const { PrismaClient } = require("@prisma/client");

// BIGINT primary keys are returned as JS BigInt. Teach JSON how to serialize
// them (as strings) so every API response carries string ids — which is also
// exactly what the admin panel's TypeScript types expect (`id: string`).
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
});

module.exports = prisma;
