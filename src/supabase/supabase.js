import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lttzpuittdmhqlwqalii.supabase.co';

const supabaseKey =
  'sb_publishable_iGesvgYbJ30kNepJmUjnEA_sHNWR4_7';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);