// One JSON line per event on stdout, which Render keeps as the service log.
// Never pass image bytes, full request bodies or personal details in here.
const config = require("./config");

const recent = []; // last errors, shown on the admin page
const MAX_RECENT = 100;

function write(level, msg, fields) {
  const line = { t: new Date().toISOString(), level, msg, ...fields };
  const out = level === "error" ? process.stderr : process.stdout;
  out.write(JSON.stringify(line) + "\n");
  return line;
}

function error(msg, err, fields) {
  const line = write("error", msg, {
    ...fields,
    err: err ? String(err.message || err).slice(0, 500) : undefined,
    stack: err && err.stack ? err.stack.split("\n").slice(0, 6).join(" | ") : undefined
  });
  recent.unshift(line);
  if (recent.length > MAX_RECENT) recent.pop();
  if (config.errorWebhook) {
    // Fire and forget: a Slack/Discord-style webhook for errors in production.
    fetch(config.errorWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `Fit Deal error: ${msg} — ${line.err || ""}`.slice(0, 1800) })
    }).catch(() => {});
  }
}

module.exports = {
  info: (msg, fields) => write("info", msg, fields),
  warn: (msg, fields) => write("warn", msg, fields),
  error,
  recentErrors: () => recent.slice()
};
