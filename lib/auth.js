// Authentication and User Progress Synchronization for Fit Deal.
// Integrates with Supabase Auth (Email/Password + Google OAuth) in production
// and provides a zero-dependency resilient local store fallback for development & tests.
const crypto = require("crypto");
const config = require("./config");
const store = require("./store");
const log = require("./log");

// Dedicated local file store for user credentials and offline fallback.
const localStore = store._fileStore(config.dataDir);

// In-memory token-to-user cache for quick lookups and local session management.
const localSessions = new Map();
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000; // 30 days

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
}

function createSessionToken(userId, email) {
  const raw = `${userId}:${email}:${Date.now()}:${crypto.randomBytes(24).toString("hex")}`;
  const sig = crypto.createHmac("sha256", config.analyticsSalt || "fitdeal-auth-secret").update(raw).digest("hex");
  return Buffer.from(`${raw}:${sig}`).toString("base64url");
}

function parseSessionToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 5) return null;
    const [userId, email, timeStr, rnd, sig] = parts;
    const raw = `${userId}:${email}:${timeStr}:${rnd}`;
    const expectedSig = crypto.createHmac("sha256", config.analyticsSalt || "fitdeal-auth-secret").update(raw).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) return null;
    const time = Number(timeStr);
    if (Date.now() - time > SESSION_TTL_MS) return null;
    return { userId, email };
  } catch (e) {
    return null;
  }
}

// ── Supabase Auth Integration ───────────────────────────────────────────────
const hasSupabase = () => Boolean(config.supabase.url && config.supabase.key);

async function supabaseCall(endpoint, method = "GET", body = null, token = null) {
  const url = `${config.supabase.url}/auth/v1/${endpoint.replace(/^\/+/, "")}`;
  const headers = {
    apikey: config.supabase.key,
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers.Authorization = `Bearer ${config.supabase.key}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000)
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: text }; }
  if (!res.ok) {
    const msg = data.msg || data.error_description || data.message || `Auth failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = data.error_code || "auth_error";
    throw err;
  }
  return data;
}

// ── Safe Data Helpers (Supabase with Local Fallback) ─────────────────────────
async function safeStoreInsert(table, row) {
  try {
    return await store.insert(table, row);
  } catch (e) {
    // If Supabase table does not exist or connection failed, use localStore
    return localStore.insert(table, row);
  }
}

async function safeStoreFind(table, where, opts = {}) {
  try {
    return await store.find(table, where, opts);
  } catch (e) {
    return localStore.find(table, where, opts);
  }
}

// ── Public Auth Methods ────────────────────────────────────────────────────
async function signUp(email, password, fullName = "") {
  email = String(email || "").trim().toLowerCase();
  password = String(password || "");
  fullName = String(fullName || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("Please enter a valid email address."), { code: "invalid_email", status: 400 });
  }
  if (!password || password.length < 6) {
    throw Object.assign(new Error("Password must be at least 6 characters."), { code: "weak_password", status: 400 });
  }

  // 1. Try Supabase Auth if configured
  if (hasSupabase()) {
    try {
      const data = await supabaseCall("signup", "POST", {
        email,
        password,
        data: { full_name: fullName }
      });
      const user = data.user || data;
      const token = data.access_token || createSessionToken(user.id, email);
      
      // Store local profile copy
      await safeStoreInsert("profiles", {
        id: user.id,
        email,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || email)}`
      }).catch(() => {});

      localSessions.set(token, { userId: user.id, email, fullName: fullName || email.split("@")[0] });

      return {
        user: { id: user.id, email, fullName: fullName || email.split("@")[0] },
        token
      };
    } catch (err) {
      log.warn("Supabase signup bypassed or rate-limited, creating local account", err.message);
    }
  }

  // 2. Local store fallback
  const existing = await localStore.find("users", { email });
  if (existing && existing.length > 0) {
    throw Object.assign(new Error("An account with this email already exists. Please log in."), { code: "user_exists", status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const userId = localStore.newId ? localStore.newId(12) : store.newId(12);
  await localStore.insert("users", {
    id: userId,
    email,
    password_hash: hash,
    salt,
    full_name: fullName
  });

  await safeStoreInsert("profiles", {
    id: userId,
    email,
    full_name: fullName,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || email)}`
  }).catch(() => {});

  const token = createSessionToken(userId, email);
  localSessions.set(token, { userId, email, fullName });

  return {
    user: { id: userId, email, fullName: fullName || email.split("@")[0] },
    token
  };
}

async function signIn(email, password) {
  email = String(email || "").trim().toLowerCase();
  password = String(password || "");

  if (!email || !password) {
    throw Object.assign(new Error("Please enter both email and password."), { code: "missing_fields", status: 400 });
  }

  // 1. Try Supabase Auth if configured
  if (hasSupabase()) {
    try {
      const data = await supabaseCall("token?grant_type=password", "POST", { email, password });
      const user = data.user;
      const fullName = (user && user.user_metadata && user.user_metadata.full_name) || email.split("@")[0];
      const token = data.access_token || createSessionToken(user.id, email);
      localSessions.set(token, { userId: user.id, email: user.email, fullName });
      return {
        user: { id: user.id, email: user.email, fullName },
        token
      };
    } catch (err) {
      log.warn("Supabase login check falling back to local credentials", err.message);
    }
  }

  // 2. Local store fallback
  const users = await localStore.find("users", { email });
  const user = users && users[0];
  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    throw Object.assign(new Error("Invalid email or password. Please try again."), { code: "invalid_credentials", status: 401 });
  }

  const token = createSessionToken(user.id, user.email);
  localSessions.set(token, { userId: user.id, email: user.email, fullName: user.full_name });

  return {
    user: { id: user.id, email: user.email, fullName: user.full_name || email.split("@")[0] },
    token
  };
}

async function getUserFromRequest(req) {
  // Check Authorization header or Cookie
  const authHeader = req.headers.authorization || "";
  let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    token = cookies.fd_token || null;
  }

  if (!token) return null;

  // 1. Check local session cache or token verification
  if (localSessions.has(token)) {
    return localSessions.get(token);
  }
  const parsed = parseSessionToken(token);
  if (parsed) {
    const user = { userId: parsed.userId, id: parsed.userId, email: parsed.email, fullName: parsed.email.split("@")[0] };
    localSessions.set(token, user);
    return user;
  }

  // 2. Check Supabase
  if (hasSupabase()) {
    try {
      const data = await supabaseCall("user", "GET", null, token);
      if (data && data.id) {
        const fullName = (data.user_metadata && data.user_metadata.full_name) || data.email.split("@")[0];
        const user = { userId: data.id, id: data.id, email: data.email, fullName };
        localSessions.set(token, user);
        return user;
      }
    } catch (e) {
      return null;
    }
  }

  return null;
}

function getGoogleAuthUrl(siteUrl) {
  const redirect = `${siteUrl}/login/?provider=google`;
  if (hasSupabase()) {
    return `${config.supabase.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
  }
  return `${redirect}&mock=true`;
}

// ── Cloud User Data Synchronization ─────────────────────────────────────────
async function getUserProgress(userId) {
  const saves = await safeStoreFind("user_saves", { user_id: userId }, { limit: 200 });
  const searches = await safeStoreFind("user_searches", { user_id: userId }, { limit: 50 });
  const profiles = await safeStoreFind("profiles", { id: userId }, { limit: 1 });
  const profile = profiles[0] || {};

  return {
    saves: saves.map((s) => s.item),
    searches: searches.map((s) => ({ query: s.query, searchId: s.search_id, savedAt: s.created_at })),
    preferences: profile.preferences || {}
  };
}

async function syncUserProgress(userId, { saves, searches, preferences }) {
  if (Array.isArray(saves)) {
    for (const item of saves.slice(0, 100)) {
      if (!item || !item.key) continue;
      const existing = await safeStoreFind("user_saves", { user_id: userId, product_key: item.key });
      if (!existing || existing.length === 0) {
        await safeStoreInsert("user_saves", {
          user_id: userId,
          search_id: item.searchId || null,
          product_key: item.key,
          item
        });
      }
    }
  }

  if (Array.isArray(searches)) {
    for (const s of searches.slice(0, 30)) {
      if (!s || !s.query) continue;
      const existing = await safeStoreFind("user_searches", { user_id: userId, query: s.query });
      if (!existing || existing.length === 0) {
        await safeStoreInsert("user_searches", {
          user_id: userId,
          query: s.query,
          search_id: s.searchId || null
        });
      }
    }
  }

  if (preferences && typeof preferences === "object") {
    try {
      const prof = await safeStoreFind("profiles", { id: userId }, { limit: 1 });
      if (prof && prof[0]) {
        await store.update("profiles", userId, {
          preferences: { ...(prof[0].preferences || {}), ...preferences },
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {}
  }

  return getUserProgress(userId);
}

module.exports = {
  signUp,
  signIn,
  getUserFromRequest,
  getGoogleAuthUrl,
  getUserProgress,
  syncUserProgress
};
