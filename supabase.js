require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
}

const TIMEOUT = 25000;

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT) })
  }
};

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, clientOptions)
  : null;

const supabaseAnon = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT) }) }
    })
  : supabase;

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'certificates';

module.exports = { supabase, supabaseAnon, BUCKET_NAME };
