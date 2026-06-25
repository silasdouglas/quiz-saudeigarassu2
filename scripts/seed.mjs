// One-off seed script: creates the test accounts defined in .env.local and
// promotes the admin account. Run with: node --env-file=.env.local scripts/seed.mjs
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

const accounts = [
  {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullName: "Administrador",
    role: "admin",
  },
  {
    email: process.env.USER_EMAIL,
    password: process.env.USER_PASSWORD,
    fullName: "Usuário Teste",
    role: "user",
  },
  {
    email: process.env.JOANA_EMAIL,
    password: process.env.JOANA_PASSWORD,
    fullName: "Joana",
    role: "user",
  },
];

for (const account of accounts) {
  if (!account.email || !account.password) {
    console.log(`Skipping account with missing email/password`);
    continue;
  }

  let userId;
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });

  if (createError) {
    if (createError.code === "email_exists") {
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list.users.find((u) => u.email === account.email)?.id;
      console.log(`${account.email} already exists, reusing user`);
    } else {
      console.error(`Failed to create ${account.email}:`, createError.message);
      continue;
    }
  } else {
    userId = created.user.id;
    console.log(`Created ${account.email}`);
  }

  if (!userId) continue;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: account.role, full_name: account.fullName })
    .eq("id", userId);

  if (updateError) {
    console.error(`Failed to set role for ${account.email}:`, updateError.message);
  } else {
    console.log(`${account.email} -> role=${account.role}`);
  }
}

console.log("Seed complete.");
