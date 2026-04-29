import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export class AdminHandler {
  
  // 1. Listar todos os usuários
  async listUsers(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // 2. Obter Analytics (Consumo de tokens, custos, etc)
  async getAnalytics(req: Request, res: Response) {
    try {
      // Exemplo de agregação básica
      const { data: logs, error: logsError } = await supabase
        .from('usage_logs')
        .select('*');

      if (logsError) throw logsError;

      const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
      const totalCost = logs.reduce((sum, log) => sum + (Number(log.cost) || 0), 0);
      const userCount = logs.length;

      res.json({
        totalTokens,
        totalCost,
        interactionsCount: userCount,
        recentLogs: logs.slice(-10)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
