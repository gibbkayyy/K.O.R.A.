// Serverless Authentication & OTP Handler
import crypto from 'crypto';

// In-memory persistent store for development/demo (Replace with KV / Supabase / Redis in production)
global.db = global.db || {
  users: {},
  otps: {},
  accountCreations: [],
  announcements: null,
  maintenance: false,
  featureToggles: { ai: true, vision: true, voice: true, announcements: true, auth: true },
  activityFeed: [],
  sessions: {}
};

export default async function handler(req, res) {
  const { action, email, otp, username, token } = req.body || {};
  const ownerEmail = process.env.OWNER_EMAIL || "kgibb2425@gmail.com";
  const now = Date.now();

  // Rate limit account creation: Max 3 accounts per 30 minutes
  if (action === "request-otp" && !global.db.users[email?.toLowerCase()]) {
    const windowStart = now - 30 * 60 * 1000;
    global.db.accountCreations = global.db.accountCreations.filter(t => t > windowStart);
    if (global.db.accountCreations.length >= 3) {
      return res.status(429).json({ error: "Too many people are creating accounts right now. Please try again later." });
    }
  }

  // Action: Request 6-digit OTP
  if (action === "request-otp") {
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Invalid email address." });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    global.db.otps[email.toLowerCase()] = { code, expires: now + 10 * 60 * 1000, attempts: 0 };
    
    // Log Activity
    global.db.activityFeed.unshift({ time: new Date().toLocaleTimeString(), text: `🔑 OTP requested for ${email}` });

    // In production, integrate email service (SendGrid/Resend). For demo console/log output:
    console.log(`[OTP SENT TO ${email}]: ${code}`);
    return res.status(200).json({ success: true, message: "OTP sent to email. (Check server logs in dev mode)" });
  }

  // Action: Verify OTP & Login / Signup
  if (action === "verify-otp") {
    const record = global.db.otps[email?.toLowerCase()];
    if (!record || record.expires < now) {
      return res.status(400).json({ error: "OTP expired or invalid. Please request a new code." });
    }
    if (record.attempts >= 5) {
      delete global.db.otps[email.toLowerCase()];
      return res.status(429).json({ error: "Too many failed attempts. OTP invalidated." });
    }
    if (record.code !== otp) {
      record.attempts++;
      return res.status(400).json({ error: "Incorrect OTP code." });
    }

    delete global.db.otps[email.toLowerCase()];
    const normEmail = email.toLowerCase();
    let user = global.db.users[normEmail];

    if (!user) {
      // New Account Creation
      global.db.accountCreations.push(now);
      user = {
        email: normEmail,
        username: username || normEmail.split("@")[0],
        createdAt: new Date().toISOString(),
        requestCount: 0,
        lastReset: new Date().toDateString(),
        isOwner: normEmail === ownerEmail.toLowerCase(),
        disabled: false
      };
      global.db.users[normEmail] = user;
    }

    // Generate Session Token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    global.db.sessions[sessionToken] = { email: normEmail, createdAt: now };

    global.db.activityFeed.unshift({ time: new Date().toLocaleTimeString(), text: `🟢 ${user.username} signed in` });

    return res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        email: user.email,
        username: user.username,
        isOwner: user.isOwner,
        requestCount: user.requestCount
      }
    });
  }

  // Action: Verify Session Token
  if (action === "check-session") {
    const session = global.db.sessions[token];
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    const user = global.db.users[session.email];
    return res.status(200).json({
      user: {
        email: user.email,
        username: user.username,
        isOwner: user.isOwner,
        requestCount: user.requestCount
      },
      maintenance: global.db.maintenance,
      announcement: global.db.announcements
    });
  }

  return res.status(400).json({ error: "Invalid action" });
}
