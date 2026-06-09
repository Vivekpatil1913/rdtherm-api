const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/prisma");

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`\n🚀 R&D Therm API running at ${env.apiUrl} (env: ${env.nodeEnv})`);
  // eslint-disable-next-line no-console
  console.log(`   CORS allowlist: ${env.corsOrigins.join(", ")}\n`);
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received — shutting down…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled Rejection:", reason);
});

module.exports = server;
