// Deletes ALL Supabase auth users, then recreates accounts from .env.local.
// Run with: node --env-file=.env.local scripts/reset-users.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Delete all existing users ---
console.log("Fetching existing users...");
const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
  console.error("Failed to list users:", listError.message);
  process.exit(1);
}

for (const user of listData.users) {
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    console.error(`Failed to delete ${user.email}:`, error.message);
  } else {
    console.log(`Deleted ${user.email}`);
  }
}

// --- Create fresh accounts ---
const accounts = [
  { email: process.env.ADMIN_EMAIL,    password: process.env.ADMIN_PASSWORD,    fullName: "Administrador", role: "admin" },
  { email: process.env.USER_EMAIL,     password: process.env.USER_PASSWORD,     fullName: "Usuário Teste", role: "user" },
  { email: process.env.JOANA_EMAIL,    password: process.env.JOANA_PASSWORD,    fullName: "Joana",         role: "user" },
  { email: process.env.LUCRECIA_EMAIL, password: process.env.LUCRECIA_PASSWORD, fullName: "Lucrecia",      role: "user" },
  { email: process.env.GIL_EMAIL,      password: process.env.GIL_PASSWORD,      fullName: "Gil",           role: "user" },
  { email: process.env.JESSICA_EMAIL,  password: process.env.JESSICA_PASSWORD,  fullName: "Jessica",       role: "user" },
  { email: process.env.CARLOS_EMAIL,   password: process.env.CARLOS_PASSWORD,   fullName: "Carlos",        role: "user" },
];

console.log("\nCreating accounts...");
for (const account of accounts) {
  if (!account.email || !account.password) {
    console.log("Skipping account with missing email/password");
    continue;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.fullName },
  });

  if (createError) {
    console.error(`Failed to create ${account.email}:`, createError.message);
    continue;
  }

  const userId = created.user.id;
  console.log(`Created ${account.email} (${userId})`);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: account.role, full_name: account.fullName })
    .eq("id", userId);

  if (updateError) {
    console.error(`Failed to set role for ${account.email}:`, updateError.message);
  } else {
    console.log(`  -> role=${account.role}`);
  }
}

console.log("\nDone.");
