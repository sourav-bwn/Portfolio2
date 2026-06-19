const { supabase } = require('./supabase');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function ensureBucket() {
  const bucketName = process.env.SUPABASE_BUCKET || 'certificates';
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === bucketName);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880
    });
    if (error) console.error('Bucket creation error:', error.message);
    else console.log(`Storage bucket "${bucketName}" created.`);
  }
}

async function seedAdmin() {
  const bcrypt = require('bcryptjs');
  const username = process.env.ADMIN_USERNAME || 'Sourav';
  const password = process.env.ADMIN_PASSWORD || 'Garai';

  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('username', username)
    .single();

  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await supabase.from('admin_users').insert({
      username,
      password_hash: hash
    });
    console.log(`Admin user "${username}" created.`);
  }
}

async function seed() {
  await ensureBucket();
  await seedAdmin();
  console.log('Seed complete.');
}

seed().catch(console.error);
