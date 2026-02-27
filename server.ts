import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("studymate.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    subscription TEXT DEFAULT 'free',
    request_count INTEGER DEFAULT 0,
    last_request_date TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    subject TEXT,
    deadline TEXT,
    priority TEXT,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    query TEXT,
    response TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add missing columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const columnNames = tableInfo.map(c => c.name);

if (!columnNames.includes('request_count')) {
  db.exec("ALTER TABLE users ADD COLUMN request_count INTEGER DEFAULT 0");
}
if (!columnNames.includes('last_request_date')) {
  db.exec("ALTER TABLE users ADD COLUMN last_request_date TEXT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password, name } = req.body;
      let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user) {
        db.prepare("INSERT INTO users (email, password, name, last_request_date) VALUES (?, ?, ?, ?)").run(email, password, name || email.split('@')[0], new Date().toISOString().split('T')[0]);
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/usage/check", (req, res) => {
    try {
      const { userId } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      if (!user) return res.status(404).json({ error: "User not found" });

      const today = new Date().toISOString().split('T')[0];
      let count = user.request_count || 0;

      if (user.last_request_date !== today) {
        count = 0;
        db.prepare("UPDATE users SET request_count = 0, last_request_date = ? WHERE id = ?").run(today, userId);
      }

      const limit = user.subscription === 'premium' ? Infinity : 5;
      res.json({ count, limit, canRequest: count < limit });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/usage/increment", (req, res) => {
    try {
      const { userId } = req.body;
      db.prepare("UPDATE users SET request_count = request_count + 1 WHERE id = ?").run(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/subscription/upgrade", (req, res) => {
    try {
      const { userId, plan } = req.body;
      db.prepare("UPDATE users SET subscription = 'premium' WHERE id = ?").run(userId);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tasks/:userId", (req, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC").all(req.params.userId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const { userId, name, subject, deadline, priority } = req.body;
      const result = db.prepare("INSERT INTO tasks (user_id, name, subject, deadline, priority) VALUES (?, ?, ?, ?, ?)").run(userId, name, subject, deadline, priority);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", (req, res) => {
    try {
      const { completed } = req.body;
      db.prepare("UPDATE tasks SET completed = ? WHERE id = ?").run(completed ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/history/:userId", (req, res) => {
    try {
      const history = db.prepare("SELECT * FROM history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20").all(req.params.userId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/history", (req, res) => {
    try {
      const { userId, type, query, response } = req.body;
      db.prepare("INSERT INTO history (user_id, type, query, response) VALUES (?, ?, ?, ?)").run(userId, type, query, response);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google OAuth
  app.get("/api/auth/google/url", (req, res) => {
    try {
      const redirectUri = req.query.redirect_uri as string;
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
      });

      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const redirectUri = `${process.env.APP_URL}/auth/callback`;
      
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      const { tokens } = await client.getToken(code as string);
      client.setCredentials(tokens);

      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const googleUser = userInfoRes.data;
      const { email, name, id: googleId } = googleUser;

      // Check if user exists
      let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user) {
        db.prepare("INSERT INTO users (email, password, name, last_request_date) VALUES (?, ?, ?, ?)").run(
          email, 
          `google_${googleId}`, 
          name, 
          new Date().toISOString().split('T')[0]
        );
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed: " + error.message);
    }
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
