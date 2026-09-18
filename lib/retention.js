// Deletes data when the privacy policy says we stop keeping it. Runs once
// shortly after start-up and then every 24 hours.
const store = require("./store");
const log = require("./log");

const DAY = 86400000;
// Keep in step with the "How long we keep it" section of /privacy/.
const RULES = [
  { table: "ballots", days: 90 },
  { table: "votes", days: 90 },
  { table: "searches", days: 90 },
  { table: "reports", days: 180 },
  { table: "events", days: 395 },
  { table: "messages", days: 365 },
  { table: "clicks", days: 730 }
];

async function run() {
  const done = {};
  for (const r of RULES) {
    try {
      done[r.table] = await store.remove(r.table, { created_at: { lt: new Date(Date.now() - r.days * DAY).toISOString() } });
    } catch (e) {
      log.error("retention failed", e, { table: r.table });
    }
  }
  log.info("retention", done);
  return done;
}

function schedule() {
  setTimeout(run, 60 * 1000).unref();
  setInterval(run, DAY).unref();
}

module.exports = { run, schedule, RULES };
