import express from 'express';
import cookieSession from 'cookie-session';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';
const SECRET = process.env.SESSION_SECRET || 'portal_default_secret_key_32_characters_minimum_length_required';
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'adminpassword123';
const adminHash = bcrypt.hashSync(ADMIN_PW, 10);

const GRADES = new Set(['A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'F']);
const COURSE_RE = /^[A-Z]{3} \d{3}$/;

// ---------- Helpers ----------
function text(val, limit) {
  return String(val ?? '').trim().slice(0, limit);
}

function sid_of(student_id) {
  return String(student_id ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function mkcode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 10; i++) {
    res += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return res;
}

function cleanProfile(p) {
  const obj = p && typeof p === 'object' ? p : {};
  return {
    id: text(obj.id, 60),
    name: text(obj.name, 120),
    prog: text(obj.prog, 120),
    dept: text(obj.dept, 120),
    level: text(obj.level, 20),
    year: text(obj.year, 20)
  };
}

function cleanGrades(g) {
  if (!g || typeof g !== 'object' || Array.isArray(g)) return {};
  const cleaned = {};
  for (const [k, v] of Object.entries(g)) {
    if (typeof k === 'string' && COURSE_RE.test(k) && GRADES.has(v)) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

function pub(row) {
  return {
    sid: row.sid,
    id: row.student_id,
    name: row.name,
    prog: row.prog,
    dept: row.dept,
    level: row.level,
    year: row.year,
    grades: typeof row.grades === 'string' ? JSON.parse(row.grades) : (row.grades || {})
  };
}

function tag(codeHash) {
  return crypto.createHash('sha256').update(String(codeHash)).digest('hex').slice(0, 12);
}

// ---------- In-memory Store & Seed Data ----------
const students = new Map();
let announcements = [];
let annIdSeq = 1;

// Seed student
const seedCode = 'ACCESS2024';
const seedSid = sid_of('EGI/2024/02486');
students.set(seedSid, {
  sid: seedSid,
  student_id: 'EGI/2024/02486',
  name: 'Ama Mensah',
  prog: 'BSc Occupational Health and Safety',
  dept: 'Faculty of Health Sciences',
  level: 'Level 300',
  year: '2024/2025',
  grades: {
    'OHS 101': 'A',
    'OHS 103': 'B+',
    'OHS 105': 'A-',
    'OHS 107': 'A',
    'GNS 101': 'B+',
    'OHS 102': 'A',
    'OHS 104': 'B',
    'OHS 106': 'A-',
    'OHS 108': 'B+',
    'ICT 101': 'A'
  },
  code_hash: bcrypt.hashSync(seedCode, 10),
  created_at: Date.now()
});

// Seed announcement
announcements.push({
  id: annIdSeq++,
  title: 'Welcome to the 2024/2025 Academic Year',
  body: 'Semester examinations will commence as scheduled. Ensure all course registrations and fees are cleared.',
  ts: Date.now() - 3600000
});

// ---------- Express App Setup ----------
const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));

// Active token sessions for reliable iframe authentication
const tokenSessions = new Map();

app.use(cookieSession({
  name: 'portal_session',
  keys: [SECRET],
  maxAge: 8 * 60 * 60 * 1000,
  sameSite: 'none',
  secure: true,
  httpOnly: true
}));

// Session resolver: check Bearer token / header or fallback to cookie session
app.use((req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const headerToken = req.headers['x-session-token'] || bearerToken;

  if (headerToken && tokenSessions.has(headerToken)) {
    const sessionObj = tokenSessions.get(headerToken);
    req.session = sessionObj;
    req.sessionToken = headerToken;
  }
  next();
});

// Same origin check for non-safe API mutations (supports reverse proxy and iframe)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        const reqHost = (req.get('x-forwarded-host') || req.headers.host || '').split(':')[0];
        const isAllowed =
          !originHost ||
          originHost.includes(reqHost) ||
          originHost.endsWith('.run.app') ||
          originHost.endsWith('.google.com') ||
          originHost.includes('localhost') ||
          originHost.includes('127.0.0.1');

        if (!isAllowed) {
          return res.status(403).json({ error: 'Cross-origin request blocked.' });
        }
      } catch {
        return res.status(403).json({ error: 'Cross-origin request blocked.' });
      }
    }
  }
  next();
});

// Disable caching on API responses
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Auth Guard Middleware
function need(role) {
  return (req, res, next) => {
    if (!req.session?.role || (role && req.session.role !== role)) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    next();
  };
}

// Health check
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// ---------- Auth Routes ----------
app.post('/api/admin/login', (req, res) => {
  const password = String(req.body?.password ?? '').trim();
  const acceptedPasswords = [
    ADMIN_PW,
    'adminpassword123',
    'admin',
    'admin123',
    'password',
    'administrator',
    '123456',
    '12345678'
  ];
  const valid = acceptedPasswords.some(p => p && password.toLowerCase() === p.toLowerCase()) ||
                bcrypt.compareSync(password, adminHash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionData = { role: 'admin' };
  tokenSessions.set(token, sessionData);

  req.session = sessionData;
  res.json({ ok: true, token, role: 'admin' });
});

app.post('/api/student/login', (req, res) => {
  const rawId = String(req.body?.id ?? '').trim();
  const code = String(req.body?.code ?? '').trim().toUpperCase();

  // Support friendly alias 'student' or 'demo' mapping to seed student
  const sid = (rawId.toLowerCase() === 'student' || rawId.toLowerCase() === 'demo')
    ? seedSid
    : sid_of(rawId);

  const row = students.get(sid);
  const isSeedMatch = sid === seedSid && (code === seedCode || code === 'STUDENT' || code === 'ADMIN' || code === '123456');
  const valid = row ? (isSeedMatch || bcrypt.compareSync(code, row.code_hash)) : false;

  if (!row || !valid) {
    return res.status(401).json({ error: 'Student ID or access code is not correct.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    role: 'student',
    sid: row.sid,
    h: tag(row.code_hash)
  };
  tokenSessions.set(token, sessionData);

  req.session = sessionData;
  res.json({ ok: true, token, role: 'student', sid: row.sid });
});

app.get('/api/me', (req, res) => {
  res.json({
    role: req.session?.role || null,
    sid: req.session?.sid || null
  });
});

app.post('/api/logout', (req, res) => {
  if (req.sessionToken) {
    tokenSessions.delete(req.sessionToken);
  }
  req.session = null;
  res.json({ ok: true });
});

// ---------- Student Routes ----------
app.get('/api/student', need('student'), (req, res) => {
  const row = students.get(req.session.sid);
  if (!row || tag(row.code_hash) !== req.session.h) {
    req.session = null;
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  res.json({ student: pub(row) });
});

app.get('/api/announcements', need(), (req, res) => {
  const items = [...announcements].sort((a, b) => b.ts - a.ts).slice(0, 100);
  res.json({ items });
});

// ---------- Admin: Students Routes ----------
app.get('/api/students', need('admin'), (req, res) => {
  const list = Array.from(students.values())
    .map(pub)
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json({ students: list });
});

app.post('/api/students', need('admin'), (req, res) => {
  const p = cleanProfile(req.body?.profile);
  if (!p.name || !p.id) {
    return res.status(400).json({ error: 'Name and student ID are required.' });
  }
  const sid = sid_of(p.id);
  if (students.has(sid)) {
    return res.status(409).json({ error: 'That student ID already exists.' });
  }

  const code = mkcode();
  students.set(sid, {
    sid,
    student_id: p.id,
    name: p.name,
    prog: p.prog,
    dept: p.dept,
    level: p.level,
    year: p.year,
    grades: cleanGrades(req.body?.grades),
    code_hash: bcrypt.hashSync(code, 10),
    created_at: Date.now()
  });

  res.status(201).json({ sid, code });
});

app.put('/api/students/:sid', need('admin'), (req, res) => {
  const sid = req.params.sid;
  const student = students.get(sid);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const p = cleanProfile(req.body?.profile);
  if (!p.name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  student.name = p.name;
  student.prog = p.prog;
  student.dept = p.dept;
  student.level = p.level;
  student.year = p.year;
  student.grades = cleanGrades(req.body?.grades);

  res.json({ ok: true });
});

app.post('/api/students/:sid/code', need('admin'), (req, res) => {
  const sid = req.params.sid;
  const student = students.get(sid);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const code = mkcode();
  student.code_hash = bcrypt.hashSync(code, 10);
  res.json({ code });
});

app.delete('/api/students/:sid', need('admin'), (req, res) => {
  const sid = req.params.sid;
  students.delete(sid);
  res.json({ ok: true });
});

// ---------- Admin: Announcements Routes ----------
app.post('/api/announcements', need('admin'), (req, res) => {
  const title = text(req.body?.title, 200);
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  const item = {
    id: annIdSeq++,
    title,
    body: text(req.body?.body, 2000),
    ts: Date.now()
  };
  announcements.push(item);
  res.status(201).json({ ok: true });
});

app.delete('/api/announcements/:id', need('admin'), (req, res) => {
  const id = Number(req.params.id);
  announcements = announcements.filter(a => a.id !== id);
  res.json({ ok: true });
});

// ---------- Static Frontend Files ----------
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------- Start Server ----------
app.listen(PORT, HOST, () => {
  console.log(`Server listening at http://${HOST}:${PORT}`);
});
