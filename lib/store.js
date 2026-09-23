// Where Fit Deal keeps its records: searches, votes, clicks, reports,
// messages and analytics events. Uploaded photos are never stored.
//
// In production this is Supabase (Postgres) through its REST API, using the
// service key, which only the server has. Without Supabase settings (local
// work, tests) the same calls go to JSON files in data/.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./config");

const TABLES = ["searches", "votes", "ballots", "clicks", "events", "reports", "messages", "commissions", "users", "profiles", "user_saves", "user_searches"];

function newId(len = 10) {
  const abc = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += abc[bytes[i] % abc.length];
  return s;
}

function checkTable(t) {
  if (!TABLES.includes(t)) throw new Error("Unknown table " + t);
}

// ── Local JSON files ───────────────────────────────────────────────────────
function fileStore(dir) {
  const tables = {};
  const timers = {};
  function load(t) {
    if (tables[t]) return tables[t];
    const file = path.join(dir, t + ".json");
    let rows = [];
    try { rows = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { rows = []; }
    tables[t] = rows;
    return rows;
  }
  function save(t) {
    clearTimeout(timers[t]);
    timers[t] = setTimeout(() => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, t + ".json"), JSON.stringify(tables[t]));
    }, 50);
  }
  function matches(row, where) {
    return Object.keys(where || {}).every((k) => {
      const w = where[k];
      if (w && typeof w === "object" && "gte" in w) return row[k] >= w.gte;
      if (w && typeof w === "object" && "lt" in w) return row[k] < w.lt;
      return row[k] === w;
    });
  }
  return {
    kind: "file",
    async insert(t, row) {
      const rows = load(t);
      const r = { id: newId(), created_at: new Date().toISOString(), ...row };
      rows.push(r);
      save(t);
      return r;
    },
    async get(t, id) {
      return load(t).find((r) => r.id === id) || null;
    },
    async update(t, id, patch) {
      const r = load(t).find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      save(t);
      return r;
    },
    async find(t, where, opts = {}) {
      let rows = load(t).filter((r) => matches(r, where));
      rows = rows.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return rows.slice(0, opts.limit || 1000);
    },
    async remove(t, where) {
      const rows = load(t);
      const keep = rows.filter((r) => !matches(r, where));
      tables[t] = keep;
      save(t);
      return rows.length - keep.length;
    }
  };
}

// ── Supabase (PostgREST) ───────────────────────────────────────────────────
function supabaseStore(url, key) {
  const base = url + "/rest/v1/";
  const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  function filter(where) {
    return Object.keys(where || {}).map((k) => {
      const w = where[k];
      if (w && typeof w === "object" && "gte" in w) return `${k}=gte.${encodeURIComponent(w.gte)}`;
      if (w && typeof w === "object" && "lt" in w) return `${k}=lt.${encodeURIComponent(w.lt)}`;
      return `${k}=eq.${encodeURIComponent(w)}`;
    }).join("&");
  }
  async function call(method, pathAndQuery, body, extra = {}) {
    const res = await fetch(base + pathAndQuery, {
      method,
      headers: { ...headers, ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`Supabase ${method} ${pathAndQuery.split("?")[0]} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? null : res.json();
  }
  return {
    kind: "supabase",
    async insert(t, row) {
      const rows = await call("POST", t, { id: newId(), ...row }, { Prefer: "return=representation" });
      return rows[0];
    },
    async get(t, id) {
      const rows = await call("GET", `${t}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      return rows[0] || null;
    },
    async update(t, id, patch) {
      const rows = await call("PATCH", `${t}?id=eq.${encodeURIComponent(id)}`, patch, { Prefer: "return=representation" });
      return rows[0] || null;
    },
    async find(t, where, opts = {}) {
      const q = filter(where);
      return call("GET", `${t}?select=*${q ? "&" + q : ""}&order=created_at.desc&limit=${opts.limit || 1000}`);
    },
    async remove(t, where) {
      const q = filter(where);
      if (!q) throw new Error("Refusing to delete a whole table");
      const rows = await call("DELETE", `${t}?${q}`, undefined, { Prefer: "return=representation" });
      return rows.length;
    }
  };
}

const backend = config.supabase.url && config.supabase.key
  ? supabaseStore(config.supabase.url, config.supabase.key)
  : fileStore(config.dataDir);

function wrap(fn) {
  return (t, ...args) => { checkTable(t); return fn(t, ...args); };
}

module.exports = {
  kind: backend.kind,
  newId,
  insert: wrap(backend.insert),
  get: wrap(backend.get),
  update: wrap(backend.update),
  find: wrap(backend.find),
  remove: wrap(backend.remove),
  _fileStore: fileStore
};
