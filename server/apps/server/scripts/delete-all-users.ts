// Delete ALL auth users (and their profiles/reports/watchlist via cascade).
// Use to reset accounts for a clean login test.
//   npm run users:reset --workspace @propertypulse/server
import { supabase } from '../src/config/supabase.js';

async function main(): Promise<void> {
  let deleted = 0;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) { console.error('List users failed:', error.message); process.exit(1); }
    const users = data.users;
    if (!users.length) break;
    for (const u of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) console.error(`  failed ${u.email}:`, delErr.message);
      else { deleted++; console.log(`  deleted ${u.email}`); }
    }
  }
  console.log(`\n✅ Removed ${deleted} account(s). Auth + profiles are now empty.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
