import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import cookieSession from "cookie-session";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("placement.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    password TEXT,
    google_id TEXT,
    cgpa REAL,
    skills TEXT,
    interests TEXT
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    score INTEGER,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS readiness (
    user_id INTEGER PRIMARY KEY,
    overall_score INTEGER,
    resume_score INTEGER,
    interview_score INTEGER,
    coding_score INTEGER,
    soft_skills_score INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'zoro-secret-key'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none',
    httpOnly: true,
  }));

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name || email.split('@')[0]);
      const user = db.prepare("SELECT id, email, name FROM users WHERE email = ?").get(email);
      res.json(user);
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Google OAuth
  app.get("/api/auth/google/url", (req, res) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: `${process.env.APP_URL}/api/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };

    const qs = new URLSearchParams(options);
    res.json({ url: `${rootUrl}?${qs.toString()}` });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string;
    try {
      const { data } = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      });

      const { data: googleUser } = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${data.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      let user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(googleUser.email);
      if (!user) {
        db.prepare("INSERT INTO users (email, name, google_id) VALUES (?, ?, ?)").run(
          googleUser.email,
          googleUser.name,
          googleUser.id
        );
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(googleUser.email);
      } else if (!user.google_id) {
        db.prepare("UPDATE users SET google_id = ? WHERE email = ?").run(googleUser.id, googleUser.email);
      }

      const { password: _, ...userWithoutPassword } = user;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(userWithoutPassword)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error("Google OAuth Error", err);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    res.json(user);
  });

  app.post("/api/scores", (req, res) => {
    const { user_id, type, score, feedback } = req.body;
    db.prepare("INSERT INTO scores (user_id, type, score, feedback) VALUES (?, ?, ?, ?)").run(user_id, type, score, feedback);
    
    // Ensure readiness record exists
    db.prepare("INSERT OR IGNORE INTO readiness (user_id, overall_score, resume_score, interview_score, coding_score, soft_skills_score) VALUES (?, 0, 0, 0, 0, 0)").run(user_id);

    // Update the specific score
    const columnMap: any = {
      'resume': 'resume_score',
      'interview': 'interview_score',
      'coding': 'coding_score',
      'soft_skills': 'soft_skills_score'
    };

    const col = columnMap[type];
    if (col) {
      db.prepare(`UPDATE readiness SET ${col} = ? WHERE user_id = ?`).run(score, user_id);
    }

    // Recalculate overall
    const row: any = db.prepare("SELECT * FROM readiness WHERE user_id = ?").get(user_id);
    const overall = Math.round((row.resume_score + row.interview_score + row.coding_score + row.soft_skills_score) / 4);
    db.prepare("UPDATE readiness SET overall_score = ? WHERE user_id = ?").run(overall, user_id);

    res.json({ success: true });
  });

  app.get("/api/readiness/:user_id", (req, res) => {
    const readiness = db.prepare("SELECT * FROM readiness WHERE user_id = ?").get(req.params.user_id);
    res.json(readiness || { overall_score: 0 });
  });

  app.get("/api/history/:user_id", (req, res) => {
    const history = db.prepare("SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC").all(req.params.user_id);
    res.json(history);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
