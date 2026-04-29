import { supabase } from '../lib/supabase';

export class ContentService {
  async getPrayer(title: string) {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .ilike('title', `%${title}%`)
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  async getDailyLiturgy(date: string) {
    const { data, error } = await supabase
      .from('daily_liturgy')
      .select('*')
      .eq('date', date)
      .single();

    if (error) return null;
    return data;
  }

  async getSaintOfDay(date: string) {
    const { data, error } = await supabase
      .from('daily_liturgy')
      .select('saint_of_day, saint_bio')
      .eq('date', date)
      .single();

    if (error) return null;
    return data;
  }
}
