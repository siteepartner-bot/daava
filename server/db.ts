import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuthSessionRecord {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface ParticipantRecord {
  id: string;
  name: string;
  token: string;
  story?: string;
  category?: string | null;
  emotion?: string | null;
  gender?: string | null;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
}

export interface CoupleSessionServerRecord {
  id: string;
  joinCode: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  status: 'waiting' | 'participant_a_completed' | 'participant_b_completed' | 'ready_for_analysis' | 'expired';
  participantA: ParticipantRecord;
  participantB?: ParticipantRecord | null;
  sharedAnalysis?: any;
  analyzedAt?: number;
}

export interface PersonalAnalysisRecord {
  id: string;
  userId: string;
  story: string;
  category: string;
  emotion: string;
  gender?: string | null;
  analysis: any;
  timestamp: number;
  createdAt: number;
}

interface DbSchema {
  users: UserRecord[];
  sessions: AuthSessionRecord[];
  personalAnalyses: PersonalAnalysisRecord[];
  coupleSessions: CoupleSessionServerRecord[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'aramshkon_db.json');

let dbData: DbSchema = {
  users: [],
  sessions: [],
  personalAnalyses: [],
  coupleSessions: [],
};

// Ensure database directory and file exist
function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      dbData = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        personalAnalyses: Array.isArray(parsed.personalAnalyses) ? parsed.personalAnalyses : [],
        coupleSessions: Array.isArray(parsed.coupleSessions) ? parsed.coupleSessions : [],
      };
    } else {
      saveDbSync();
    }
  } catch (err) {
    console.error('Failed to initialize database file:', err);
  }
}

function saveDbSync() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
function queueSaveDb() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDbSync();
  }, 300);
}

// Boot DB
initDb();

// Crypto helpers
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const selectedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, selectedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: selectedSalt };
}

export function generateToken(): string {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
}

export function generateUserId(): string {
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// DB Operations
export const db = {
  // Users
  createUser(name: string, email: string, password: string): UserRecord {
    const cleanEmail = email.trim().toLowerCase();
    const existing = dbData.users.find((u) => u.email === cleanEmail);
    if (existing) {
      throw new Error('این ایمیل قبلاً ثبت‌نام کرده است.');
    }

    const { hash, salt } = hashPassword(password);
    const user: UserRecord = {
      id: generateUserId(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hash,
      salt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dbData.users.push(user);
    queueSaveDb();
    return user;
  },

  findUserByEmail(email: string): UserRecord | undefined {
    const cleanEmail = email.trim().toLowerCase();
    return dbData.users.find((u) => u.email === cleanEmail);
  },

  findUserById(id: string): UserRecord | undefined {
    return dbData.users.find((u) => u.id === id);
  },

  updateUserName(userId: string, name: string): UserRecord {
    const user = dbData.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('کاربر پیدا نشد.');
    }
    user.name = name.trim();
    user.updatedAt = Date.now();
    queueSaveDb();
    return user;
  },

  deleteUser(userId: string): void {
    dbData.users = dbData.users.filter((u) => u.id !== userId);
    dbData.sessions = dbData.sessions.filter((s) => s.userId !== userId);
    dbData.personalAnalyses = dbData.personalAnalyses.filter((a) => a.userId !== userId);
    queueSaveDb();
  },

  // Sessions
  createAuthSession(userId: string): AuthSessionRecord {
    const token = generateToken();
    const session: AuthSessionRecord = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
    dbData.sessions.push(session);
    queueSaveDb();
    return session;
  },

  findSession(token: string): AuthSessionRecord | undefined {
    const cleanToken = token.trim();
    const session = dbData.sessions.find((s) => s.token === cleanToken);
    if (session && session.expiresAt < Date.now()) {
      db.deleteSession(cleanToken);
      return undefined;
    }
    return session;
  },

  deleteSession(token: string): void {
    const cleanToken = token.trim();
    dbData.sessions = dbData.sessions.filter((s) => s.token !== cleanToken);
    queueSaveDb();
  },

  // Personal Analyses
  getUserAnalyses(userId: string): PersonalAnalysisRecord[] {
    return dbData.personalAnalyses
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  saveAnalysis(
    userId: string,
    data: {
      id?: string;
      story: string;
      category: string;
      emotion: string;
      gender?: string | null;
      analysis: any;
      timestamp?: number;
    }
  ): PersonalAnalysisRecord {
    const recordId = data.id || 'rec-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const existingIndex = dbData.personalAnalyses.findIndex((a) => a.id === recordId && a.userId === userId);

    const record: PersonalAnalysisRecord = {
      id: recordId,
      userId,
      story: data.story,
      category: data.category,
      emotion: data.emotion,
      gender: data.gender || null,
      analysis: data.analysis,
      timestamp: data.timestamp || Date.now(),
      createdAt: Date.now(),
    };

    if (existingIndex >= 0) {
      dbData.personalAnalyses[existingIndex] = record;
    } else {
      dbData.personalAnalyses.unshift(record);
    }

    queueSaveDb();
    return record;
  },

  deleteAnalysis(userId: string, recordId: string): void {
    dbData.personalAnalyses = dbData.personalAnalyses.filter(
      (a) => !(a.id === recordId && a.userId === userId)
    );
    queueSaveDb();
  },

  clearUserAnalyses(userId: string): void {
    dbData.personalAnalyses = dbData.personalAnalyses.filter((a) => a.userId !== userId);
    queueSaveDb();
  },

  syncLocalAnalyses(userId: string, items: any[]): PersonalAnalysisRecord[] {
    if (!Array.isArray(items)) return db.getUserAnalyses(userId);

    for (const item of items) {
      if (item && item.story && item.analysis) {
        db.saveAnalysis(userId, {
          id: item.id,
          story: item.story,
          category: item.category || 'رابطه',
          emotion: item.emotion || 'ناراحت',
          gender: item.gender,
          analysis: item.analysis,
          timestamp: item.timestamp || Date.now(),
        });
      }
    }
    return db.getUserAnalyses(userId);
  },

  // Couple Sessions
  findCoupleSession(idOrCode: string): CoupleSessionServerRecord | undefined {
    if (!idOrCode) return undefined;
    const lookupKey = idOrCode.trim().toUpperCase();
    return dbData.coupleSessions.find((s) => s.id === idOrCode || s.joinCode.toUpperCase() === lookupKey);
  },

  saveCoupleSession(session: CoupleSessionServerRecord): CoupleSessionServerRecord {
    const existingIndex = dbData.coupleSessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      dbData.coupleSessions[existingIndex] = session;
    } else {
      dbData.coupleSessions.unshift(session);
    }
    queueSaveDb();
    return session;
  },

  deleteCoupleSession(sessionId: string): void {
    dbData.coupleSessions = dbData.coupleSessions.filter((s) => s.id !== sessionId);
    queueSaveDb();
  },
};
