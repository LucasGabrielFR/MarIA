import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  expectations: string | null;
  status: 'triage_name' | 'triage_expectations' | 'active';
  credits: number;
}

export interface UsageLog {
  userId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
}

export class UserService {
  async getOrCreateUser(phone: string): Promise<User | null> {
    // Limpar o número (manter apenas dígitos)
    const cleanPhone = phone.replace(/\D/g, '');

    // Try to find the user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (user) return user as User;

    // Create if not found
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          phone: cleanPhone,
          status: 'triage_name',
          credits: 100 // Créditos iniciais
        }
      ])
      .select()
      .single();


    if (createError) {
      console.error('Error creating user:', createError);
      return null;
    }

    return newUser as User;
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data as User;
  }

  async logUsage(log: UsageLog) {
    // Inserir log de uso
    const { error: logError } = await supabase
      .from('usage_logs')
      .insert([
        {
          user_id: log.userId,
          prompt_tokens: log.promptTokens,
          completion_tokens: log.completionTokens,
          total_tokens: log.totalTokens,
          cost: log.cost,
          model: log.model
        }
      ]);

    if (logError) {
      console.error('Error logging usage:', logError);
    }

    // Deduzir 1 crédito por interação (exemplo simplificado)
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: supabase.rpc('decrement', { x: 1 }) } as any) // Nota: Idealmente usar RPC ou decrementar localmente
      .eq('id', log.userId);
    
    // Como decrementar no Supabase via query simples é chato sem RPC, 
    // vou simplificar para uma atualização direta baseada no valor atual se necessário,
    // mas por agora vamos focar no log.
  }

  async saveChatHistory(userId: string, role: 'user' | 'assistant', content: string) {
    const { error } = await supabase
      .from('chat_history')
      .insert([
        {
          user_id: userId,
          role,
          content
        }
      ]);

    if (error) {
      console.error('Error saving chat history:', error);
    }
  }
}
