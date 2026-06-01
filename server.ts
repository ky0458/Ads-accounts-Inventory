import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGODB_URI provided in environment. MongoDB features will be disabled.');
}

// Mongoose Schema
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
  blueWhaleSync: { type: Boolean, default: false }
});

const AdAccount: any = mongoose.models.AdAccount || mongoose.model('AdAccount', AdAccountSchema);

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
    const { accounts } = req.body; // array of accounts
    if (!Array.isArray(accounts)) return res.status(400).json({ error: 'Expected array of accounts' });

    // Upsert each account
    const operations = accounts.map((acc: any) => ({
      updateOne: {
        filter: { id: acc.id },
        update: { $set: acc },
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
    await AdAccount.findOneAndUpdate({ id }, updateData);
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
