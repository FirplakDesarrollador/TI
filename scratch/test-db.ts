import { createServerSupabaseClient } from './src/lib/supabase';

async function test() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('ti_productos').select('count', { count: 'exact', head: true });
    console.log('Count:', data, 'Error:', error);
  } catch (e) {
    console.error('Crash:', e);
  }
}

test();
