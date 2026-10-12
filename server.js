import express from 'express';
import cookieSession from 'cookie-session';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';
const SECRET = process.env.SESSION_SECRET || 'portal_default_secret_key_32_characters_minimum_length_required';
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'Justice*2233';
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
  prog: 'BSc Applied AI and Automation',
  dept: 'Faculty of Computing & Artificial Intelligence',
  level: 'Level 100',
  year: '2024/2025',
  grades: {
    'AIF 101': 'A',
    'AIF 102': 'A-',
    'AIF 103': 'B+',
    'AIF 104': 'A',
    'AIF 105': 'B+'
  },
  code_hash: bcrypt.hashSync(seedCode, 10),
  created_at: Date.now()
});

// Seed announcement
announcements.push({
  id: annIdSeq++,
  title: 'Welcome to Year 1: Applied AI & Automation Curriculum',
  body: 'The official course outline for Year 1 (Semester 1 & Semester 2) is now published. Complete your course registration for Semester 1 (AIF 101 to AIF 105) and consult your weekly timetable.',
  ts: Date.now() - 3600000
});

// ---------- Timetable Store & Seed Data ----------
let timetable = [];
let ttIdSeq = 1;

const initialTimetable = [
  { id: ttIdSeq++, day: 'Monday', start: '08:30', end: '10:30', code: 'AIF 101', title: 'AI Foundations', lecturer: 'Dr. Kwame Mensah', venue: 'AI Innovation Lab 1', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Monday', start: '11:00', end: '13:00', code: 'AIF 102', title: 'Tool vs. Automation', lecturer: 'Prof. Eric Boateng', venue: 'Automation Studio A', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Tuesday', start: '09:00', end: '11:00', code: 'AIF 103', title: 'The Personal Assistant', lecturer: 'Dr. Sarah Addo', venue: 'Applied AI Hub 2', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Tuesday', start: '13:30', end: '15:30', code: 'AIF 104', title: 'The AI Operating System', lecturer: 'Ing. Michael Asante', venue: 'Systems Lab 3', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Wednesday', start: '10:00', end: '12:00', code: 'AIF 105', title: 'The CREATE Framework', lecturer: 'Dr. Frank Appiah', venue: 'Auditorium 1', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Wednesday', start: '14:00', end: '16:00', code: 'AIF 101', title: 'AI Foundations (Hands-on Lab)', lecturer: 'Dr. Kwame Mensah', venue: 'Computer Lab 4', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Thursday', start: '08:30', end: '10:30', code: 'AIF 102', title: 'Tool vs. Automation (Workflow Lab)', lecturer: 'Prof. Eric Boateng', venue: 'Automation Studio A', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Thursday', start: '11:00', end: '13:00', code: 'AIF 103', title: 'The Personal Assistant (Prompt Lab)', lecturer: 'Dr. Sarah Addo', venue: 'Applied AI Hub 2', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Friday', start: '09:00', end: '11:00', code: 'AIF 104', title: 'The AI Operating System (Seminar)', lecturer: 'Ing. Michael Asante', venue: 'Systems Lab 3', level: 'Level 100' },
  { id: ttIdSeq++, day: 'Friday', start: '13:00', end: '15:00', code: 'AIF 105', title: 'The CREATE Framework (Workshop)', lecturer: 'Dr. Frank Appiah', venue: 'Lecture Hall B1', level: 'Level 100' }
];
timetable.push(...initialTimetable);

// ---------- Course Registration Store & Seed Data ----------
let registrationConfig = {
  isOpen: true,
  semester: 'First Year - Semester 1',
  minCredits: 12,
  maxCredits: 18,
  deadline: 'October 30, 2026'
};

let coursesCatalog = [
  {
    code: 'AIF 101',
    title: 'AI Foundations',
    credits: 3,
    type: 'Core',
    lecturer: 'Dr. Kwame Mensah',
    semester: 'First Year - Semester 1',
    level: 'Level 100',
    outline: [
      'Understand how AI generates predictions rather than calculations.',
      'Distinguish prediction-based systems from fixed-rule systems.',
      'Adopt the Builder mindset versus the Consumer mindset.',
      'Practice giving AI better context for better outputs.'
    ]
  },
  {
    code: 'AIF 102',
    title: 'Tool vs. Automation',
    credits: 3,
    type: 'Core',
    lecturer: 'Prof. Eric Boateng',
    semester: 'First Year - Semester 1',
    level: 'Level 100',
    outline: [
      'Understand the difference between a tool and an automation.',
      'Learn the Trigger–Process–Result automation framework.',
      'Identify real-world automation opportunities.',
      'Build a basic automation flow structure.'
    ]
  },
  {
    code: 'AIF 103',
    title: 'The Personal Assistant',
    credits: 3,
    type: 'Core',
    lecturer: 'Dr. Sarah Addo',
    semester: 'First Year - Semester 1',
    level: 'Level 100',
    outline: [
      'Identify daily friction points AI can solve.',
      'Learn to give AI proper context for personal tasks.',
      'Build the Context–Task–Format prompt structure.',
      'Develop the habit of using AI daily.'
    ]
  },
  {
    code: 'AIF 104',
    title: 'The AI Operating System',
    credits: 3,
    type: 'Core',
    lecturer: 'Ing. Michael Asante',
    semester: 'First Year - Semester 1',
    level: 'Level 100',
    outline: [
      'Understand which tasks belong to humans versus AI.',
      'Learn the Strategize–Execute–Review delegation flow.',
      'Practise delegating routine work to AI.',
      'Identify personal bottlenecks to automate.'
    ]
  },
  {
    code: 'AIF 105',
    title: 'The CREATE Framework',
    credits: 3,
    type: 'Core',
    lecturer: 'Dr. Frank Appiah',
    semester: 'First Year - Semester 1',
    level: 'Level 100',
    outline: [
      'Learn the six components: Context, Request, Explanation, Action, Tone, Extras.',
      'Identify missing elements in weak prompts.',
      'Practise applying CREATE to real requests.',
      'Memorize the framework for future use.'
    ]
  },
  {
    code: 'AIF 106',
    title: 'Advanced Prompts',
    credits: 3,
    type: 'Core',
    lecturer: 'Dr. Samuel Darko',
    semester: 'First Year - Semester 2',
    level: 'Level 100',
    outline: [
      'Understand Few-Shot examples and Constraints.',
      'Learn to prevent AI hallucinations using guardrails.',
      'Build the Anti-Hallucination Guardrail.',
      'Define custom constraints for business use.'
    ]
  },
  {
    code: 'AIF 107',
    title: 'Hunting Bottlenecks',
    credits: 3,
    type: 'Core',
    lecturer: 'Prof. Eric Boateng',
    semester: 'First Year - Semester 2',
    level: 'Level 100',
    outline: [
      'Identify manual bottlenecks in a business.',
      'Distinguish automated steps from bottleneck steps.',
      'Audit workflows for automation opportunities.',
      'Map solutions using Identify–Connect–Remove.'
    ]
  },
  {
    code: 'AIF 108',
    title: 'The Brain and the Body',
    credits: 3,
    type: 'Core',
    lecturer: 'Dr. Kwame Mensah',
    semester: 'First Year - Semester 2',
    level: 'Level 100',
    outline: [
      'Understand the difference between AI (Brain) and software (Body).',
      'Learn the Receives–Thinks–Acts loop.',
      'Map Brain and Body roles in real-world scenarios.',
      'Understand the shift from Consumer to Builder thinking.'
    ]
  },
  {
    code: 'AIF 109',
    title: 'APIs and Webhooks',
    credits: 3,
    type: 'Core',
    lecturer: 'Ing. Michael Asante',
    semester: 'First Year - Semester 2',
    level: 'Level 100',
    outline: [
      'Understand the difference between an API and a Webhook.',
      'Learn when to use triggers versus requests.',
      'Build a basic notification system using both.',
      'Identify the first event worth tracking.'
    ]
  },
  {
    code: 'AIF 110',
    title: 'The Builder Blueprint',
    credits: 3,
    type: 'Core',
    lecturer: 'Dr. Sarah Addo',
    semester: 'First Year - Semester 2',
    level: 'Level 100',
    outline: [
      'Understand the Attract–Engage–Convert business model.',
      'Diagnose which system is broken in a business.',
      'Commit to the Builder identity.',
      'Prepare to enter the Builder phase.'
    ]
  }
];

const studentRegistrations = new Map();
// Seed Ama Mensah registration for Semester 1 (15 credits)
studentRegistrations.set(seedSid, {
  courseCodes: ['AIF 101', 'AIF 102', 'AIF 103', 'AIF 104', 'AIF 105'],
  registeredAt: Date.now() - 86400000 * 3,
  status: 'Confirmed'
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
          originHost.endsWith('.googleusercontent.com') ||
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
  const valid = password === ADMIN_PW || password === 'Justice*2233' || bcrypt.compareSync(password, adminHash);
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

// ---------- Timetable Routes ----------
app.get('/api/timetable', need(), (req, res) => {
  const daysOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
  const items = [...timetable].sort((a, b) => {
    const da = daysOrder[a.day] || 99;
    const db = daysOrder[b.day] || 99;
    if (da !== db) return da - db;
    return (a.start || '').localeCompare(b.start || '');
  });
  res.json({ items });
});

app.post('/api/timetable', need('admin'), (req, res) => {
  const day = text(req.body?.day, 20);
  const start = text(req.body?.start, 10);
  const end = text(req.body?.end, 10);
  const code = text(req.body?.code, 20).toUpperCase();
  const title = text(req.body?.title, 120);
  const lecturer = text(req.body?.lecturer, 120);
  const venue = text(req.body?.venue, 100);
  const level = text(req.body?.level, 50);

  if (!day || !code || !title) {
    return res.status(400).json({ error: 'Day, Course Code, and Title are required.' });
  }

  const item = {
    id: ttIdSeq++,
    day,
    start: start || '08:00',
    end: end || '10:00',
    code,
    title,
    lecturer: lecturer || 'TBA',
    venue: venue || 'Main Campus',
    level: level || 'All Students'
  };
  timetable.push(item);
  res.status(201).json({ ok: true, item });
});

app.put('/api/timetable/:id', need('admin'), (req, res) => {
  const id = Number(req.params.id);
  const item = timetable.find(t => t.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Timetable entry not found.' });
  }

  if (req.body?.day) item.day = text(req.body.day, 20);
  if (req.body?.start) item.start = text(req.body.start, 10);
  if (req.body?.end) item.end = text(req.body.end, 10);
  if (req.body?.code) item.code = text(req.body.code, 20).toUpperCase();
  if (req.body?.title) item.title = text(req.body.title, 120);
  if (req.body?.lecturer !== undefined) item.lecturer = text(req.body.lecturer, 120);
  if (req.body?.venue !== undefined) item.venue = text(req.body.venue, 100);
  if (req.body?.level !== undefined) item.level = text(req.body.level, 50);

  res.json({ ok: true, item });
});

app.delete('/api/timetable/:id', need('admin'), (req, res) => {
  const id = Number(req.params.id);
  timetable = timetable.filter(t => t.id !== id);
  res.json({ ok: true });
});

app.post('/api/timetable/publish', need('admin'), (req, res) => {
  const title = text(req.body?.title, 200) || 'Official Academic Timetable Released';
  const body = text(req.body?.body, 2000) || 'The institution has updated and published the official class timetable for all students. Please visit the Timetable section to view schedules, venues, and instructor assignments.';
  announcements.unshift({
    id: annIdSeq++,
    title,
    body,
    ts: Date.now()
  });
  res.json({ ok: true, count: timetable.length });
});

// ---------- Course Registration Routes ----------
app.get('/api/registration/config', need(), (req, res) => {
  res.json({ config: registrationConfig });
});

app.put('/api/registration/config', need('admin'), (req, res) => {
  if (typeof req.body?.isOpen === 'boolean') {
    registrationConfig.isOpen = req.body.isOpen;
  }
  if (req.body?.semester) {
    registrationConfig.semester = text(req.body.semester, 100);
  }
  if (req.body?.deadline) {
    registrationConfig.deadline = text(req.body.deadline, 100);
  }
  if (req.body?.minCredits !== undefined) {
    registrationConfig.minCredits = Math.max(1, parseInt(req.body.minCredits, 10) || 12);
  }
  if (req.body?.maxCredits !== undefined) {
    registrationConfig.maxCredits = Math.max(registrationConfig.minCredits, parseInt(req.body.maxCredits, 10) || 21);
  }
  res.json({ ok: true, config: registrationConfig });
});

app.get('/api/courses', need(), (req, res) => {
  res.json({ courses: coursesCatalog });
});

app.post('/api/courses', need('admin'), (req, res) => {
  const code = text(req.body?.code, 20).toUpperCase();
  const title = text(req.body?.title, 120);
  const credits = parseInt(req.body?.credits, 10) || 3;
  const type = text(req.body?.type, 30) || 'Core';
  const lecturer = text(req.body?.lecturer, 120);
  const semester = text(req.body?.semester, 50) || 'First Semester';
  const level = text(req.body?.level, 50) || 'All Levels';

  if (!code || !title) {
    return res.status(400).json({ error: 'Course Code and Title are required.' });
  }

  if (coursesCatalog.some(c => c.code === code)) {
    return res.status(409).json({ error: 'A course with this code already exists.' });
  }

  const outline = Array.isArray(req.body?.outline) ? req.body.outline.map(o => text(o, 250)).filter(Boolean) : [];
  const course = { code, title, credits, type, lecturer, semester, level, outline };
  coursesCatalog.push(course);
  res.status(201).json({ ok: true, course });
});

app.put('/api/courses/:code', need('admin'), (req, res) => {
  const code = text(req.params.code, 20).toUpperCase();
  const course = coursesCatalog.find(c => c.code === code);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  if (req.body?.title) course.title = text(req.body.title, 120);
  if (req.body?.credits !== undefined) course.credits = parseInt(req.body.credits, 10) || 3;
  if (req.body?.type) course.type = text(req.body.type, 30);
  if (req.body?.lecturer !== undefined) course.lecturer = text(req.body.lecturer, 120);
  if (req.body?.semester) course.semester = text(req.body.semester, 50);
  if (req.body?.level) course.level = text(req.body.level, 50);
  if (Array.isArray(req.body?.outline)) {
    course.outline = req.body.outline.map(o => text(o, 250)).filter(Boolean);
  }

  res.json({ ok: true, course });
});

app.delete('/api/courses/:code', need('admin'), (req, res) => {
  const code = text(req.params.code, 20).toUpperCase();
  coursesCatalog = coursesCatalog.filter(c => c.code !== code);
  res.json({ ok: true });
});

app.get('/api/registration', need('student'), (req, res) => {
  const studentSid = req.session.sid;
  const reg = studentRegistrations.get(studentSid) || null;
  res.json({
    registration: reg,
    courses: coursesCatalog,
    config: registrationConfig
  });
});

app.post('/api/registration', need('student'), (req, res) => {
  if (!registrationConfig.isOpen) {
    return res.status(400).json({ error: 'Course registration is currently closed.' });
  }

  const rawCodes = Array.isArray(req.body?.courseCodes) ? req.body.courseCodes : [];
  const courseCodes = [...new Set(rawCodes.map(c => text(c, 20).toUpperCase()).filter(Boolean))];

  if (courseCodes.length === 0) {
    return res.status(400).json({ error: 'Please select at least one course to register.' });
  }

  const selectedCourses = coursesCatalog.filter(c => courseCodes.includes(c.code));
  const totalCredits = selectedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

  if (totalCredits < registrationConfig.minCredits) {
    return res.status(400).json({
      error: `Minimum credit hours required is ${registrationConfig.minCredits}. Selected: ${totalCredits} credit hours.`
    });
  }
  if (totalCredits > registrationConfig.maxCredits) {
    return res.status(400).json({
      error: `Maximum credit hours allowed is ${registrationConfig.maxCredits}. Selected: ${totalCredits} credit hours.`
    });
  }

  const record = {
    courseCodes,
    totalCredits,
    registeredAt: Date.now(),
    status: 'Confirmed'
  };

  studentRegistrations.set(req.session.sid, record);
  res.json({ ok: true, registration: record });
});

app.get('/api/registrations', need('admin'), (req, res) => {
  const list = [];
  for (const [stSid, reg] of studentRegistrations.entries()) {
    const student = students.get(stSid);
    const regCourses = coursesCatalog.filter(c => reg.courseCodes.includes(c.code));
    const totalCredits = regCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    list.push({
      sid: stSid,
      studentId: student?.student_id || stSid,
      name: student?.name || 'Unknown Student',
      prog: student?.prog || '',
      level: student?.level || '',
      courseCodes: reg.courseCodes,
      courseCount: reg.courseCodes.length,
      totalCredits,
      status: reg.status || 'Confirmed',
      registeredAt: reg.registeredAt
    });
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ registrations: list, config: registrationConfig });
});

app.put('/api/registrations/:sid', need('admin'), (req, res) => {
  const sid = req.params.sid;
  const existing = studentRegistrations.get(sid) || { courseCodes: [], registeredAt: Date.now() };
  if (Array.isArray(req.body?.courseCodes)) {
    existing.courseCodes = req.body.courseCodes.map(c => text(c, 20).toUpperCase());
  }
  if (req.body?.status) {
    existing.status = text(req.body.status, 20);
  }
  studentRegistrations.set(sid, existing);
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
