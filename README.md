# Student Portal | eLearning Group Institute

Student and administrator portal for eLearning Group Institute offering the **BSc in Cybersecurity and Artificial Intelligence** degree programme across Years 1, 2, and 3 (6 semesters).

## Features

- **Full Cybersecurity & AI Curriculum:** 36 structured courses covering Year 1, Year 2, and Year 3 (6 semesters total, 6 courses per semester) in Artificial Intelligence, Neural Foundations, Deep Learning, Cloud Security, Ethical Hacking, Digital Forensics, and Enterprise Security Architecture.
- **Student Portal:**
  - Student login with Student ID and access code (default seed student: `EGI/2024/02486` / `ACCESS2024` for **Effah Emmanuella**, Level 300).
  - Academic records, GPA calculations, semester breakdowns, and announcements.
  - Interactive class timetable schedule (downloadable in HTML/PDF and printable).
  - Course registration management and official registration slip generator.
  - Official Academic Transcripts and Results Slips generation (HTML/PDF and CSV export).
- **Admin Console:**
  - Secure administrator login with password authentication.
  - Student directory management with 26 enrolled students (grades, levels, reset access codes).
  - Dynamic course catalog with full editing capabilities (`PUT /api/courses/:code`).
  - Master timetable management and announcement broadcast system.
- **Modern Node.js Architecture:** Built with Node.js, Express, Cookie Sessions, bcryptjs password hashing, and clean responsive CSS.

## 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Set the following variables:
- `SESSION_SECRET`: Session encryption secret (32+ characters).
- `ADMIN_PASSWORD`: Administrator portal access password (default: `Justice*2233`).
- `DOMAIN`: Domain name if deploying behind a reverse proxy.

## 2. Run Locally

```bash
npm install
npm run dev
```

The portal runs on `http://localhost:3000`.

## 3. Deployment

### Option A: Docker with automatic HTTPS (Caddy)

```bash
docker compose up -d --build
```

### Option B: Node.js production service

```bash
npm install --production
node server.js
```

### Option C: GitHub Pages (Static Client Mode)
The static frontend can also run on GitHub Pages via `.github/workflows/static.yml` with client-side state fallbacks.

## 4. Default Credentials

- **Admin Login:** Password `Justice*2233`
- **Student Login (Effah Emmanuella - Level 300):**
  - **Student ID:** `EGI/2024/02486`
  - **Access Code:** `ACCESS2024`

## Project Structure

```
server.js          Node.js Express backend API & session management
app.js             Frontend application logic, state, and document generation
index.html         HTML5 shell and responsive portal interface
styles.css         Modern stylesheet with responsive layout and print styles
logo.jpg           Institutional logo
metadata.json      Applet metadata configuration
.github/           GitHub Actions workflows for static deployment
Dockerfile         Container specification
docker-compose.yml Multi-container setup with Caddy HTTPS
```

