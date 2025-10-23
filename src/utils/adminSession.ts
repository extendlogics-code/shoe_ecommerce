type AdminRole = "superadmin" | "viewer";

export type AdminSession = {
  email: string;
  role: AdminRole;
  createdAt: number;
};

const STORAGE_KEY = "admin:session";

const resolveStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const candidates: Storage[] = [window.sessionStorage, window.localStorage];
  for (const candidate of candidates) {
    try {
      const testKey = "__admin_session_probe__";
      candidate.setItem(testKey, "probe");
      candidate.removeItem(testKey);
      return candidate;
    } catch {
      // Storage might be unavailable (Safari private mode, disabled cookies, etc).
    }
  }
  return null;
};

let cachedStorage: Storage | null | undefined;
let memorySession: AdminSession | null = null;

const getStorage = (): Storage | null => {
  if (cachedStorage !== undefined) {
    return cachedStorage;
  }
  cachedStorage = resolveStorage();
  return cachedStorage;
};

export const getAdminSession = (): AdminSession | null => {
  const storage = getStorage();
  if (!storage) {
    return memorySession;
  }
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (!parsed || typeof parsed.email !== "string") {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    const role = parsed.role === "superadmin" ? "superadmin" : "viewer";
    return {
      email: parsed.email,
      role,
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now()
    };
  } catch {
    storage.removeItem(STORAGE_KEY);
    memorySession = null;
    return null;
  }
};

export const setAdminSession = (session: { email: string; role: AdminRole }) => {
  const storage = getStorage();
  if (!storage) {
    memorySession = {
      email: session.email,
      role: session.role,
      createdAt: Date.now()
    };
    return;
  }
  const payload: AdminSession = {
    email: session.email,
    role: session.role,
    createdAt: Date.now()
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  memorySession = null;
};

export const clearAdminSession = () => {
  const storage = getStorage();
  if (!storage) {
    memorySession = null;
    return;
  }
  storage.removeItem(STORAGE_KEY);
  memorySession = null;
};

export const isAdminAuthenticated = () => getAdminSession() !== null;
