import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!);

async function run() {
  const { data: flows, error } = await supabase.from('automatic_flows').select('*');
  if (error || !flows) {
    console.error('Error fetching flows:', error);
    return;
  }

  const toolMappings: Record<string, Record<string, string>> = {
    reminder_flow: {
      reminder_prayer_select: 'prayer_list'
    },
    conscience_exam_flow: {
      step_confession: 'guided_exam_focus'
    },
    liturgy_flow: {
      choose_format: 'liturgy_fetch'
    },
    subscription_flow: {
      select_plan: 'asaas_pricing'
    },
    welcome_flow: {
      ask_daily_liturgy: 'user_preference_toggle'
    }
  };

  for (const flow of flows) {
    const mappings = toolMappings[flow.key];
    if (!mappings) continue;

    let modified = false;
    const steps = flow.steps || {};

    for (const [stepKey, toolId] of Object.entries(mappings)) {
      if (steps[stepKey] && steps[stepKey].action !== toolId) {
        steps[stepKey].action = toolId;
        modified = true;
      }
    }

    if (modified) {
      const { error: updateError } = await supabase
        .from('automatic_flows')
        .update({ steps, updated_at: new Date().toISOString() })
        .eq('id', flow.id);

      if (updateError) {
        console.error(`Error updating flow ${flow.key}:`, updateError);
      } else {
        console.log(`Flow ${flow.key} enriched with node tools successfully!`);
      }
    } else {
      console.log(`Flow ${flow.key} already up-to-date.`);
    }
  }
}

run();
