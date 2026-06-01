import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: [
    'https://ads-accounts-inventory.vercel.app',
    /^http:\/\/localhost:\d+$/,
    /^https:\/\/.*\.run\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGODB_URI provided in environment. MongoDB features will be disabled.');
}

// Mongoose Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'USER' },
  emailVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  avatarUrl: { type: String, default: '' }
});

const User: any = mongoose.models.User || mongoose.model('User', UserSchema);

const VerificationCodeSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  type: { type: String, required: true } // 'REGISTER', '2FA_ENABLE', '2FA_LOGIN'
});

const VerificationCode: any = mongoose.models.VerificationCode || mongoose.model('VerificationCode', VerificationCodeSchema);

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: String, required: true },
  timestamp: { type: String, required: true },
  details: { type: String, required: true }
});

const AdAccountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  fbStatus: { type: String, required: true },
  inventoryStatus: { type: String, required: true },
  importDate: { type: String, required: true },
  exportDate: { type: String },
  linkedPartners: { type: [{ id: String, name: String }], default: [] },
  paymentCard: { type: String },
  limit: { type: Number, required: true },
  accountType: { type: String, required: true },
  accountScope: { type: String, required: true },
  timezone: { type: String, required: true },
  currency: { type: String, required: true },
  spend: { type: Number, required: true, default: 0 },
  blueWhaleSync: { type: Boolean, default: false },
  createdBy: { type: String },
  auditLogs: { type: [AuditLogSchema], default: [] }
});

const AdAccount: any = mongoose.models.AdAccount || mongoose.model('AdAccount', AdAccountSchema);

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailVerificationCode(email: string, type: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  await VerificationCode.create({ email, code, expiresAt, type });
  console.log(`\n\n=== MOCK EMAIL ===\nTo: ${email}\nAction: ${type}\nCode: ${code}\n==================\n`);
  return code;
}

// Auth Routes
app.post('/api/auth/register', async (req: any, res: any) => {
  if (!MONGODB_URI) return res.status(503).json({ error: 'MongoDB not configured' });
  try {
    const username = String(req.body.username || '');
    const email = String(req.body.email || '');
    const password = String(req.body.password || '');
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) return res.status(400).json({ error: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const isFirstUser = (await User.countDocuments()) === 0;

    user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: isFirstUser ? 'ADMIN' : 'USER',
      emailVerified: false
    });

    await sendEmailVerificationCode(email, 'REGISTER');

    res.json({ success: true, message: 'Verification code sent to email', userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/verify-register', async (req: any, res: any) => {
  if (!MONGODB_URI) return res.status(503).json({ error: 'MongoDB not configured' });
  try {
    const email = String(req.body.email || '');
    const code = String(req.body.code || '');
    if (!email || !code) return res.status(400).json({ error: 'Missing fields' });
    const vc = await VerificationCode.findOne({ email, code, type: 'REGISTER', expiresAt: { $gt: new Date() } });
    if (!vc) return res.status(400).json({ error: 'Invalid or expired code' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.emailVerified = true;
    await user.save();
    await VerificationCode.deleteOne({ _id: vc._id });

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { username: user.username, role: user.role, email: user.email, avatarUrl: user.avatarUrl, twoFactorEnabled: user.twoFactorEnabled } });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  if (!MONGODB_URI) return res.status(503).json({ error: 'MongoDB not configured' });
  try {
    const emailOrUsername = String(req.body.emailOrUsername || '');
    const password = String(req.body.password || '');
    if (!emailOrUsername || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({
      $or: [{ username: emailOrUsername }, { email: emailOrUsername }]
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.emailVerified) {
       // resend code
       await sendEmailVerificationCode(user.email, 'REGISTER');
       return res.json({ requireEmailVerification: true, email: user.email });
    }

    if (user.twoFactorEnabled) {
       await sendEmailVerificationCode(user.email, '2FA_LOGIN');
       return res.json({ require2FA: true, email: user.email });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { username: user.username, role: user.role, email: user.email, avatarUrl: user.avatarUrl, twoFactorEnabled: user.twoFactorEnabled } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/verify-2fa-login', async (req: any, res: any) => {
  if (!MONGODB_URI) return res.status(503).json({ error: 'MongoDB not configured' });
  try {
    const email = String(req.body.email || '');
    const code = String(req.body.code || '');
    if (!email || !code) return res.status(400).json({ error: 'Missing fields' });
    const vc = await VerificationCode.findOne({ email, code, type: '2FA_LOGIN', expiresAt: { $gt: new Date() } });
    if (!vc) return res.status(400).json({ error: 'Invalid or expired code' });

    const user = await User.findOne({ email });
    await VerificationCode.deleteOne({ _id: vc._id });

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { username: user.username, role: user.role, email: user.email, avatarUrl: user.avatarUrl, twoFactorEnabled: user.twoFactorEnabled } });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/auth/send-2fa-setup', authenticateToken, async (req: any, res: any) => {
  try {
    await sendEmailVerificationCode(req.user.email, '2FA_ENABLE');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/auth/verify-2fa-setup', authenticateToken, async (req: any, res: any) => {
  try {
    const code = String(req.body.code || '');
    if (!code) return res.status(400).json({ error: 'Missing code' });
    const vc = await VerificationCode.findOne({ email: req.user.email, code, type: '2FA_ENABLE', expiresAt: { $gt: new Date() } });
    if (!vc) return res.status(400).json({ error: 'Invalid or expired code' });

    const user = await User.findById(req.user.id);
    user.twoFactorEnabled = true;
    await user.save();
    await VerificationCode.deleteOne({ _id: vc._id });

    res.json({ success: true, twoFactorEnabled: true });
  } catch (e) {
     res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const avatarUrl = req.body.avatarUrl === undefined ? undefined : String(req.body.avatarUrl);
    const user = await User.findById(req.user.id);
    if(avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    await user.save();
    res.json({ success: true, user: { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, twoFactorEnabled: user.twoFactorEnabled } });
  } catch (e) {
     res.status(500).json({ error: 'Failed' });
  }
});

// Old Auth routes cleanup
app.post('/api/login', (req: any, res: any) => res.status(400).json({ error: 'Use /api/auth/login' }));
app.post('/api/users', (req: any, res: any) => res.status(400).json({ error: 'Use /api/auth/register' }));

// API Routes
app.get('/api/accounts', async (req: any, res: any) => {
  if (!MONGODB_URI) return res.status(503).json({ error: 'MongoDB not configured' });
  try {
    const accounts = await AdAccount.find({});
    // Mongoose maps _id, we map it out or just send to client. Client expects string `id`.
    // We already have `id` as custom string field for act_123.
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/api/accounts/import', async (req: any, res: any) => {
  if (!MONGODB_URI) return res.status(503).json({ error: 'MongoDB not configured' });
  try {
    const { accounts } = req.body;
    const username = req.headers['x-user-name'] || 'Unknown';
    if (!Array.isArray(accounts)) return res.status(400).json({ error: 'Expected array of accounts' });

    const operations = accounts.map((acc: any) => ({
      updateOne: {
        filter: { id: acc.id },
        update: { 
          $set: {
            ...acc,
            createdBy: acc.createdBy || username,
          },
          $push: {
            auditLogs: {
              action: 'IMPORT',
              user: username,
              timestamp: new Date().toISOString(),
              details: `Imported with status ${acc.inventoryStatus}`
            }
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await AdAccount.bulkWrite(operations);
    }

    res.json({ success: true, imported: accounts.length });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import accounts' });
  }
});

app.put('/api/accounts/:id', async (req: any, res: any) => {
  if (!MONGODB_URI) return res.status(503).json({ error: 'MongoDB not configured' });
  try {
    const { id } = req.params;
    const updateData = req.body;
    const username = req.headers['x-user-name'] || 'Unknown';
    
    // Automatically set exportDate if moving to OUT_OF_STOCK
    if (updateData.inventoryStatus === 'OUT_OF_STOCK') {
      updateData.exportDate = new Date().toISOString();
    } else if (updateData.inventoryStatus === 'IN_STOCK') {
      updateData.exportDate = null;
    }

    const details = Object.entries(updateData)
      .filter(([k]) => k !== 'exportDate' && k !== 'auditLogs')
      .map(([k, v]) => `${k} => ${v}`)
      .join(', ');

    await AdAccount.findOneAndUpdate(
      { id },
      {
        $set: updateData,
        $push: {
          auditLogs: {
            action: 'UPDATE',
            user: username,
            timestamp: new Date().toISOString(),
            details: details || 'General update'
          }
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Setup Vite Middleware or Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
