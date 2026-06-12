// Promote a single account to admin (and demote everyone else to investor),
// enforcing the "one admin only" rule.
//   npm run make:admin --workspace @propertypulse/server -- admin@example.com
import { supabase } from '../src/config/supabase.js';

async function main(): Promise<void> {
  const email = process.argv.find((a) => a.includes('@'));
  if (!email) {
    console.error('Usage: npm run make:admin --workspace @propertypulse/server -- <email>');
    process.exit(1);
  }

  // Demote any existing admins first (single-admin policy).
  await supabase.from('profiles').update({ role: 'investor' }).eq('role', 'admin');

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .ilike('email', email)
    .select('id,email,role');
  if (error) { console.error('Failed:', error.message); process.exit(1); }
  if (!data || data.length === 0) {
    console.error(`No profile found for ${email}. Register that account first, then re-run.`);
    process.exit(1);
  }
  console.log(`✅ ${data[0].email} is now the admin. All other accounts are investors.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
