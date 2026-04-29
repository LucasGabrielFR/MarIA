import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class N8nHandler {
  // GET /api/n8n/user/:phone
  async handleUserCheck(req: Request, res: Response) {
    const { phone } = req.params;
    try {
      const user = await userService.getOrCreateUser(phone);
      if (!user) return res.status(500).json({ error: 'Falha ao gerenciar usuário' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // PATCH /api/n8n/user/:id
  async handleUserUpdate(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    try {
      const user = await userService.updateUser(id, updates);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/n8n/log
  async handleUsageLog(req: Request, res: Response) {
    const { userId, promptTokens, completionTokens, totalTokens, cost, model } = req.body;
    try {
      await userService.logUsage({
        userId,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        model
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/n8n/chat-history
  async handleChatHistory(req: Request, res: Response) {
    const { userId, role, content } = req.body;
    try {
      await userService.saveChatHistory(userId, role, content);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
