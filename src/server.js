const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/prisma");

// How many consecutive ports to try when the configured one is taken.
// In production we never shift ports — a busy port there is a real error.
const MAX_PORT_ATTEMPTS = env.isProd ? 1 : 10;

const server = app.listen(env.port);

let attempt = 0;

server.on("listening", () => {
  const { port } = server.address();
  const url = port === env.port ? env.apiUrl : `http://localhost:${port}`;
  // eslint-disable-next-line no-console
  console.log(`\n🚀 R&D Therm API running at ${url} (env: ${env.nodeEnv})`);
  if (port !== env.port) {
    // eslint-disable-next-line no-console
    console.log(`   ⚠️  Port ${env.port} was busy — using ${port} instead.`);
  }
  // eslint-disable-next-line no-console
  console.log(`   CORS allowlist: ${env.corsOrigins.join(", ")}\n`);
});

server.on("error", (err) => {
  if (err.code !== "EADDRINUSE") throw err;

  attempt += 1;
  if (attempt >= MAX_PORT_ATTEMPTS) {
    // eslint-disable-next-line no-console
    console.error(
      `\n❌ Port ${env.port} is in use` +
        (MAX_PORT_ATTEMPTS > 1 ? ` and the next ${MAX_PORT_ATTEMPTS - 1} ports are too.` : ".") +
        `\n   Free it or set PORT in .env to another value.\n`
    );
    process.exit(1);
  }

  const next = env.port + attempt;
  // eslint-disable-next-line no-console
  console.warn(`⚠️  Port ${env.port + attempt - 1} in use, trying ${next}…`);
  setTimeout(() => server.listen(next), 100);
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
