const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'kgibb2425@gmail.com';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// In-Memory Database Stores (Replace with persistent DB in production)
const db = {
    users: new Map(), // email -> { email, username, createdAt, lastSeen, aiDisabled, requestsRemaining, lastReset }
    otps: new Map(),  // email -> { code, expiresAt, attempts }
    activityFeed: [],
    announcements: [],
    settings: {
        aiEnabled: true,
        visionEnabled: true,
        voiceEnabled: true,
        announcementsEnabled: true,
        authEnabled: true,
        maintenanceMode: false
    },
    clientVersion: '1.0.0',
    globalReloadTriggered: false
};

// Helper: Log Activity
function logActivity(message, type = 'info') {
    const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message,
        type
    };
    db.activityFeed.unshift(entry);
    if (db.activityFeed.length > 100) db.activityFeed.pop();
}

// Middleware: Owner Check
function requireOwner(req, res, next) {
    if (!req.session.user || req.session.user.email !== OWNER_EMAIL) {
        return res.status(403).json({ error: 'Unauthorized. Owner access required.' });
    }
    next();
}

// Middleware: Maintenance Check
function checkMaintenance(req, res, next) {
    if (db.settings.maintenanceMode && req.session.user?.email !== OWNER_EMAIL) {
        return res.status(503).json({ 
            maintenance: true, 
            message: "K.O.R.A. is currently undergoing maintenance." 
        });
    }
    next();
}

// Authentication Routes
app.post('/api/auth/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required.' });
    }

    // Rate limit OTP requests (1 per 60s)
    const existingOtp = db.otps.get(email);
    if (existingOtp && Date.now() - (existingOtp.expiresAt - 600000 + 60000) < 60000) {
        return res.status(429).json({ error: 'Please wait before requesting another code.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    db.otps.set(email, { code, expiresAt, attempts: 0 });
    
    // In production, integrate email service (SendGrid/Resend) here
    console.log(`[OTP for ${email}]: ${code}`);

    logActivity(`🔑 OTP requested for ${email}`, 'auth');
    res.json({ success: true, message: 'Verification code sent.' });
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { email, code, username } = req.body;
    const otpRecord = db.otps.get(email);

    if (!otpRecord || Date.now() > otpRecord.expiresAt) {
        return res.status(400).json({ error: 'Verification code expired or invalid.' });
    }

    if (otpRecord.attempts >= 5) {
        db.otps.delete(email);
        return res.status(429).json({ error: 'Too many failed attempts. Request a new code.' });
    }

    if (otpRecord.code !== code) {
        otpRecord.attempts++;
        return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    // OTP verified successfully, clear OTP
    db.otps.delete(email);

    let user = db.users.get(email);
    let isNewUser = false;

    if (!user) {
        if (!username) {
            return res.json({ requireUsername: true });
        }
        isNewUser = true;
        user = {
            email,
            username,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            aiDisabled: false,
            requestsRemaining: 50,
            lastReset: new Date().toDateString(),
            onlineDuration: 0
        };
        db.users.set(email, user);
        logActivity(`👤 ${username} created an account`, 'user');
    }

    const isOwner = email === OWNER_EMAIL;
    req.session.user = { email, username: user.username, isOwner };

    logActivity(`🟢 ${user.username} signed in`, 'auth');
    res.json({ success: true, user: req.session.user });
});

app.get('/api/auth/session', (req, res) => {
    if (!req.session.user) {
        return res.json({ authenticated: false });
    }
    const user = db.users.get(req.session.user.email);
    res.json({
        authenticated: true,
        user: req.session.user,
        requestsRemaining: user ? user.requestsRemaining : 50,
        announcements: db.announcements.filter(a => new Date(a.expiresAt) > Date.now()),
        maintenanceMode: db.settings.maintenanceMode
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Mission Control Owner Routes
app.get('/api/owner/stats', requireOwner, (req, res) => {
    const now = new Date().toDateString();
    let totalRequestsToday = 0;
    let activeUsersCount = 0;

    db.users.forEach(u => {
        if (u.lastReset !== now) {
            u.requestsRemaining = 50;
            u.lastReset = now;
        }
        if (new Date() - new Date(u.lastSeen) < 15 * 60 * 1000) {
            activeUsersCount++;
        }
    });

    res.json({
        systemStatus: db.settings.maintenanceMode ? 'MAINTENANCE' : 'ONLINE',
        geminiStatus: 'OPERATIONAL',
        serverStatus: 'HEALTHY',
        aiStatus: db.settings.aiEnabled ? 'ENABLED' : 'DISABLED',
        currentVersion: db.clientVersion,
        usersOnline: activeUsersCount,
        todaysUsers: db.users.size,
        todaysAiRequests: totalRequestsToday,
        quotaRemaining: '98.4%',
        activityFeed: db.activityFeed,
        settings: db.settings,
        users: Array.from(db.users.values())
    });
});

app.post('/api/owner/announcement', requireOwner, (req, res) => {
    const { text, durationMinutes } = req.body;
    const expiresAt = durationMinutes === 'permanent' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + parseInt(durationMinutes) * 60 * 1000).toISOString();

    const announcement = { id: crypto.randomUUID(), text, expiresAt };
    db.announcements.push(announcement);
    logActivity(`📢 Global announcement published: "${text}"`, 'system');
    res.json({ success: true, announcement });
});

app.post('/api/owner/reload', requireOwner, (req, res) => {
    db.globalReloadTriggered = true;
    logActivity(`🔄 Global reload triggered`, 'system');
    setTimeout(() => { db.globalReloadTriggered = false; }, 10000);
    res.json({ success: true });
});

app.post('/api/owner/settings', requireOwner, (req, res) => {
    const { key, value } = req.body;
    if (key in db.settings) {
        db.settings[key] = value;
        logActivity(`⚙️ Setting ${key} changed to ${value}`, 'system');
    }
    res.json({ success: true, settings: db.settings });
});

app.listen(PORT, () => {
    console.log(`K.O.R.A. server running on port ${PORT}`);
});
