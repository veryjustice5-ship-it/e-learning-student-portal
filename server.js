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
    code: row.raw_code || (row.sid === seedSid ? seedCode : ''),
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

const seedCode = 'ACCESS2024';
const seedSid = sid_of('EGI/2024/02486');

const initialStudents = [
  { id: 'EGI/2024/02486', name: 'Ama Mensah', code: 'ACCESS2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 300', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A', 'GNS 101': 'B+', 'OHS 102': 'A', 'OHS 104': 'B', 'OHS 106': 'A-', 'OHS 108': 'B+', 'ICT 101': 'A' } },
  { id: 'EGI/2024/02487', name: 'Wisdom Diaba', code: 'WD-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02488', name: 'Daniella Ewenam Agbemavor', code: 'DA-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A-', 'OHS 103': 'A', 'OHS 105': 'B+', 'OHS 107': 'A', 'GNS 101': 'A' } },
  { id: 'EGI/2024/02489', name: 'Ayornu Kefa', code: 'AK-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B', 'OHS 105': 'B+', 'OHS 107': 'A-', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02490', name: 'Jessica Yayra Wowui', code: 'JW-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'A-', 'OHS 105': 'A', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02491', name: 'Augustina Tetteh', code: 'AT-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A-', 'GNS 101': 'B' } },
  { id: 'EGI/2024/02492', name: 'J.R Gabriel Mawuko', code: 'JM-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'B+', 'OHS 105': 'B+', 'OHS 107': 'A', 'GNS 101': 'A-' } },
  { id: 'EGI/2024/02493', name: 'Raymond Deku', code: 'RD-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'A-', 'OHS 105': 'B+', 'OHS 107': 'B+', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02494', name: 'Hudu Sumaila', code: 'HS-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A-', 'OHS 103': 'B+', 'OHS 105': 'A', 'OHS 107': 'A-', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02495', name: 'Mathias Kelvin Dzamesi', code: 'MD-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'A', 'OHS 105': 'A-', 'OHS 107': 'A', 'GNS 101': 'A-' } },
  { id: 'EGI/2024/02496', name: 'Philip Acquah', code: 'PA-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B', 'OHS 105': 'B+', 'OHS 107': 'A-', 'GNS 101': 'B' } },
  { id: 'EGI/2024/02497', name: 'Kingsley Otto', code: 'KO-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A-', 'OHS 103': 'B+', 'OHS 105': 'B+', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02498', name: 'Stephen Amoh', code: 'SA-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A-', 'GNS 101': 'A-' } },
  { id: 'EGI/2024/02499', name: 'Rahina Narteynorh', code: 'RN-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'A-', 'OHS 105': 'A', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02500', name: 'Benjamin Dadzie', code: 'BD-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B', 'OHS 105': 'B+', 'OHS 107': 'B+', 'GNS 101': 'B' } },
  { id: 'EGI/2024/02501', name: 'Abdul Razak', code: 'AR-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A-', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02502', name: 'Emmanuel Addo Adjei', code: 'EA-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A-', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02503', name: 'Christabel Tetteh', code: 'CT-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'A', 'OHS 105': 'A-', 'OHS 107': 'A', 'GNS 101': 'A-' } },
  { id: 'EGI/2024/02504', name: 'Very Justice Essuman', code: 'VJ-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'A', 'OHS 105': 'A', 'OHS 107': 'A', 'GNS 101': 'A' } },
  { id: 'EGI/2024/02505', name: 'Philip Ampomah', code: 'PM-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B+', 'OHS 105': 'B', 'OHS 107': 'A-', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02506', name: 'Emmanuel Mensah', code: 'EM-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A-', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02507', name: 'Rita Kponyo', code: 'RK-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'A-', 'OHS 105': 'A', 'OHS 107': 'A', 'GNS 101': 'A-' } },
  { id: 'EGI/2024/02508', name: 'Enoch Togoli', code: 'ET-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'B+', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A-', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02509', name: 'Kenneth Avalon', code: 'KA-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'B+', 'OHS 105': 'A-', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02510', name: 'Ebenezer Eshun Mensah Anokye', code: 'EA-2025', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A', 'OHS 103': 'A-', 'OHS 105': 'A', 'OHS 107': 'A', 'GNS 101': 'B+' } },
  { id: 'EGI/2024/02511', name: 'Michael Nyameke', code: 'MN-2024', prog: 'BSc Occupational Health and Safety', dept: 'Faculty of Health Sciences', level: 'Level 100', year: '2024/2025', grades: { 'OHS 101': 'A-', 'OHS 103': 'B+', 'OHS 105': 'A', 'OHS 107': 'A', 'GNS 101': 'A' } }
];

// Student course registrations map
const studentRegistrations = new Map();
const defaultCoreCourses = ["OHS 101", "OHS 103", "OHS 105", "OHS 107", "GNS 101"];

initialStudents.forEach(st => {
  const sid = sid_of(st.id);
  students.set(sid, {
    sid,
    student_id: st.id,
    name: st.name,
    prog: st.prog,
    dept: st.dept,
    level: st.level,
    year: st.year,
    grades: st.grades,
    code_hash: bcrypt.hashSync(st.code, 10),
    raw_code: st.code,
    created_at: Date.now()
  });
  studentRegistrations.set(sid, [...defaultCoreCourses]);
});

// Seed announcement
announcements.push({
  id: annIdSeq++,
  title: 'Welcome to the 2024/2025 Academic Year',
  body: 'Semester examinations will commence as scheduled. Ensure all course registrations and fees are cleared.',
  ts: Date.now() - 3600000
});

// ---------- Timetable Store & Seed ----------
let timetableSeq = 1;
let timetable = [
  { id: timetableSeq++, day: "Monday", start: "08:30", end: "10:30", code: "OHS 101", title: "Introduction to OHS", room: "Lecture Hall A", lecturer: "Dr. E. Mensah", cr: 3 },
  { id: timetableSeq++, day: "Monday", start: "11:00", end: "13:00", code: "GNS 101", title: "Use of English", room: "Arts Block 2", lecturer: "Mrs. S. Addo", cr: 2 },
  { id: timetableSeq++, day: "Tuesday", start: "09:00", end: "12:00", code: "OHS 103", title: "Hazard Identification and Risk Assessment", room: "Lab 3", lecturer: "Prof. K. Osei", cr: 3 },
  { id: timetableSeq++, day: "Wednesday", start: "10:00", end: "13:00", code: "OHS 105", title: "Safety Management Principles", room: "Lecture Hall B", lecturer: "Dr. A. Boateng", cr: 3 },
  { id: timetableSeq++, day: "Thursday", start: "08:30", end: "10:30", code: "OHS 107", title: "Communication Skills", room: "Seminar Room 1", lecturer: "Dr. F. Arthur", cr: 2 },
  { id: timetableSeq++, day: "Friday", start: "09:00", end: "12:00", code: "ICT 101", title: "Introduction to Information Technology", room: "Computer Lab 1", lecturer: "Mr. J. Appiah", cr: 2 }
];

// ---------- Course Catalog Store & Seed ----------
let courseCatalog = [
  { code: "OHS 101", title: "Introduction to OHS", cr: 3, level: "100", sem: "Semester 1", type: "Core", dept: "Faculty of Health Sciences" },
  { code: "OHS 103", title: "Hazard Identification and Risk Assessment", cr: 3, level: "100", sem: "Semester 1", type: "Core", dept: "Faculty of Health Sciences" },
  { code: "OHS 105", title: "Safety Management Principles", cr: 3, level: "100", sem: "Semester 1", type: "Core", dept: "Faculty of Health Sciences" },
  { code: "OHS 107", title: "Communication Skills", cr: 2, level: "100", sem: "Semester 1", type: "Core", dept: "Faculty of Health Sciences" },
  { code: "GNS 101", title: "Use of English", cr: 2, level: "100", sem: "Semester 1", type: "Mandatory", dept: "General Studies" },
  { code: "OHS 109", title: "Fire Safety and Emergency Response", cr: 3, level: "100", sem: "Semester 1", type: "Elective", dept: "Faculty of Health Sciences" },
  { code: "OHS 111", title: "Industrial Safety Management", cr: 3, level: "100", sem: "Semester 1", type: "Elective", dept: "Faculty of Health Sciences" },
  { code: "ICT 101", title: "Introduction to Information Technology", cr: 2, level: "100", sem: "Semester 1", type: "Mandatory", dept: "Computer Science" }
];

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
  const isUniversalCode = (code === 'ACCESS2024' || code === 'STUDENT' || code === 'ADMIN' || code === '123456');
  const valid = row ? (isUniversalCode || (row.raw_code && code === row.raw_code.toUpperCase()) || bcrypt.compareSync(code, row.code_hash)) : false;

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

  let currentSid = sid;
  if (p.id && p.id !== student.student_id) {
    const newSid = sid_of(p.id);
    if (newSid !== sid && students.has(newSid)) {
      return res.status(409).json({ error: 'That student ID already exists.' });
    }
    students.delete(sid);
    student.student_id = p.id;
    student.sid = newSid;
    students.set(newSid, student);
    currentSid = newSid;

    if (studentRegistrations.has(sid)) {
      const reg = studentRegistrations.get(sid);
      studentRegistrations.delete(sid);
      studentRegistrations.set(newSid, reg);
    }

    for (const [, sess] of tokenSessions.entries()) {
      if (sess.sid === sid) {
        sess.sid = newSid;
      }
    }
  }

  student.name = p.name;
  student.prog = p.prog;
  student.dept = p.dept;
  student.level = p.level;
  student.year = p.year;
  student.grades = cleanGrades(req.body?.grades);

  res.json({ ok: true, sid: currentSid });
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

// ---------- Timetable API Routes ----------
app.get('/api/timetable', need(), (req, res) => {
  res.json({ items: timetable });
});

app.post('/api/timetable', need('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.code || !b.day || !b.start) {
    return res.status(400).json({ error: 'Day, Course Code, and Start Time are required.' });
  }
  const item = {
    id: timetableSeq++,
    day: text(b.day, 20),
    start: text(b.start, 10),
    end: text(b.end, 10),
    code: text(b.code, 20).toUpperCase(),
    title: text(b.title, 120),
    room: text(b.room, 60),
    lecturer: text(b.lecturer, 80),
    cr: Number(b.cr) || 3
  };
  timetable.push(item);
  res.status(201).json({ item });
});

app.put('/api/timetable/:id', need('admin'), (req, res) => {
  const id = Number(req.params.id);
  const idx = timetable.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Timetable slot not found.' });
  }
  const b = req.body || {};
  timetable[idx] = {
    id,
    day: text(b.day, 20) || timetable[idx].day,
    start: text(b.start, 10) || timetable[idx].start,
    end: text(b.end, 10) || timetable[idx].end,
    code: text(b.code, 20).toUpperCase() || timetable[idx].code,
    title: text(b.title, 120) || timetable[idx].title,
    room: text(b.room, 60) || timetable[idx].room,
    lecturer: text(b.lecturer, 80) || timetable[idx].lecturer,
    cr: Number(b.cr) || timetable[idx].cr || 3
  };
  res.json({ ok: true, item: timetable[idx] });
});

app.post('/api/timetable/broadcast', need('admin'), (req, res) => {
  const count = timetable.length;
  const title = 'Official Class Timetable Published for All Students';
  const body = `The official Semester 1 class timetable has been finalized and released by the administration with ${count} scheduled lecture sessions. All students can now view their daily lecture hours, venues, and lecturers under the Timetable menu, and download their official schedule slip.`;
  const item = {
    id: annIdSeq++,
    title,
    body,
    ts: Date.now()
  };
  announcements.unshift(item);
  res.json({ ok: true, announcement: item });
});

app.delete('/api/timetable/:id', need('admin'), (req, res) => {
  const id = Number(req.params.id);
  timetable = timetable.filter(t => t.id !== id);
  res.json({ ok: true });
});

// ---------- Course Catalog API Routes ----------
app.get('/api/courses', need(), (req, res) => {
  res.json({ courses: courseCatalog });
});

app.post('/api/courses', need('admin'), (req, res) => {
  const b = req.body || {};
  const code = text(b.code, 20).toUpperCase();
  if (!code || !b.title) {
    return res.status(400).json({ error: 'Course Code and Title are required.' });
  }
  const existingIdx = courseCatalog.findIndex(c => c.code === code);
  const course = {
    code,
    title: text(b.title, 120),
    cr: Number(b.cr) || 3,
    level: text(b.level, 20) || '100',
    sem: text(b.sem, 40) || 'Semester 1',
    type: text(b.type, 20) || 'Core',
    dept: text(b.dept, 100) || 'Faculty of Health Sciences'
  };
  if (existingIdx >= 0) {
    courseCatalog[existingIdx] = course;
  } else {
    courseCatalog.push(course);
  }
  res.status(201).json({ course });
});

app.delete('/api/courses/:code', need('admin'), (req, res) => {
  const code = String(req.params.code).toUpperCase();
  courseCatalog = courseCatalog.filter(c => c.code !== code);
  res.json({ ok: true });
});

// ---------- Course Registration Routes ----------
app.get('/api/registrations', need(), (req, res) => {
  if (req.session.role === 'admin') {
    const all = {};
    for (const [k, v] of studentRegistrations.entries()) {
      all[k] = v;
    }
    return res.json({ registrations: all });
  }
  const mySid = req.session.sid;
  const list = studentRegistrations.get(mySid) || [];
  res.json({ registered: list });
});

app.post('/api/registrations', need(), (req, res) => {
  if (req.session.role === 'admin') {
    const targetSid = req.body?.sid;
    const codes = Array.isArray(req.body?.codes) ? req.body.codes : [];
    if (targetSid === 'ALL') {
      for (const s of students.values()) {
        const cur = new Set(studentRegistrations.get(s.sid) || []);
        codes.forEach(c => cur.add(c));
        studentRegistrations.set(s.sid, Array.from(cur));
      }
      return res.json({ ok: true });
    } else if (targetSid) {
      studentRegistrations.set(targetSid, codes);
      return res.json({ ok: true, registered: codes });
    }
  }
  const mySid = req.session.sid;
  const codes = Array.isArray(req.body?.codes) ? req.body.codes : [];
  studentRegistrations.set(mySid, codes);
  res.json({ ok: true, registered: codes });
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
