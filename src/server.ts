import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { N8nHandler } from './handlers/n8n.handler';
import { AdminHandler } from './handlers/admin.handler';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health Check
app.get('/', (req, res) => {
  res.send({ status: 'MarIA is watching over you 🕊️' });
});

// N8n Integration API
const n8nHandler = new N8nHandler();
app.get('/api/n8n/user/:phone', (req, res) => n8nHandler.handleUserCheck(req, res));
app.patch('/api/n8n/user/:id', (req, res) => n8nHandler.handleUserUpdate(req, res));
app.post('/api/n8n/log', (req, res) => n8nHandler.handleUsageLog(req, res));
app.post('/api/n8n/chat-history', (req, res) => n8nHandler.handleChatHistory(req, res));

// Admin API
const adminHandler = new AdminHandler();
app.get('/api/admin/users', (req, res) => adminHandler.listUsers(req, res));
app.get('/api/admin/analytics', (req, res) => adminHandler.getAnalytics(req, res));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`n8n Integration API ready`);
});
