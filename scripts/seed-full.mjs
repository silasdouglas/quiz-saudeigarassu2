/**
 * Full seed: clears all app data and reseeds with realistic fictitious data.
 * Run with: node --env-file=.env.local scripts/seed-full.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── 1. CLEAR DATA ────────────────────────────────────────────────────────────
console.log("Clearing tables...");
for (const [table, col] of [
  ["attempt_answers", "id"],
  ["quiz_attempts", "id"],
  ["schedule_questions", "schedule_id"],
  ["weekly_schedules", "id"],
  ["question_answers", "question_id"],
  ["questions", "id"],
  ["categories", "id"],
]) {
  const { error } = await sb.from(table).delete().neq(col, "00000000-0000-0000-0000-000000000000");
  if (error) console.warn(`  ${table}: ${error.message}`);
  else console.log(`  cleared ${table}`);
}

// ── 2. CATEGORIES ────────────────────────────────────────────────────────────
console.log("\nInserting categories...");
const { data: cats, error: catErr } = await sb
  .from("categories")
  .insert([
    { name: "Vacinas e Imunização" },
    { name: "Técnica de Administração" },
    { name: "Farmacologia" },
    { name: "Biossegurança" },
  ])
  .select();
if (catErr) { console.error(catErr); process.exit(1); }

const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]));
console.log("  categories:", Object.keys(catMap).join(", "));

// ── 3. QUESTIONS ─────────────────────────────────────────────────────────────
console.log("\nInserting questions...");

const questionDefs = [
  // Vacinas e Imunização — enfermeiros (media/dificil)
  {
    cat: "Vacinas e Imunização", diff: "media", time: 45,
    q: "Qual é a temperatura correta para armazenamento da maioria das vacinas inativadas na rede de frio?",
    a: "Entre -8°C e -2°C", b: "Entre +2°C e +8°C", c: "Entre +8°C e +15°C", d: "Temperatura ambiente (até 25°C)", ans: "b",
  },
  {
    cat: "Vacinas e Imunização", diff: "media", time: 45,
    q: "A vacina BCG deve ser administrada por qual via?",
    a: "Intramuscular profunda", b: "Subcutânea", c: "Intradérmica", d: "Oral", ans: "c",
  },
  {
    cat: "Vacinas e Imunização", diff: "dificil", time: 60,
    q: "Qual das seguintes é contraindicação absoluta para a vacina tríplice viral (SCR)?",
    a: "Criança com febre após dose anterior", b: "Gestante ou imunodeprimida", c: "Alergia a ovo", d: "Lactente com 6 meses", ans: "b",
  },
  {
    cat: "Vacinas e Imunização", diff: "dificil", time: 60,
    q: "Em caso de anafilaxia pós-vacinação, qual é a conduta inicial prioritária do enfermeiro?",
    a: "Anti-histamínico oral e observação por 30 min", b: "Adrenalina 1:1000 (0,3–0,5 mL) IM na coxa", c: "Acionar SAMU e aguardar", d: "Corticoide EV e monitorar PA", ans: "b",
  },
  {
    cat: "Vacinas e Imunização", diff: "media", time: 45,
    q: "O intervalo mínimo entre duas vacinas de vírus vivos atenuados aplicadas em dias diferentes é de:",
    a: "7 dias", b: "14 dias", c: "30 dias", d: "Não há intervalo mínimo", ans: "c",
  },
  {
    cat: "Vacinas e Imunização", diff: "dificil", time: 60,
    q: "A vacina Hepatite B no recém-nascido deve ser aplicada em qual prazo?",
    a: "Até 12 horas de vida", b: "Até 7 dias de vida", c: "Com 1 mês de vida", d: "Ao completar 2 meses de vida", ans: "a",
  },
  {
    cat: "Vacinas e Imunização", diff: "media", time: 45,
    q: "Qual vacina do calendário infantil é administrada por via oral?",
    a: "Pneumocócica 10-valente", b: "Rotavírus humano (VORH)", c: "Meningocócica C", d: "Varicela", ans: "b",
  },
  {
    cat: "Vacinas e Imunização", diff: "dificil", time: 60,
    q: "Quanto ao evento adverso da vacina DTP, qual classifica-se como grave?",
    a: "Eritema < 2,5 cm nas primeiras 24h", b: "Febre até 38,5°C nas primeiras 48h", c: "Abscesso estéril no local", d: "Dor leve por 1–2 dias", ans: "c",
  },
  {
    cat: "Vacinas e Imunização", diff: "media", time: 45,
    q: "A vacina influenza é indicada anualmente para qual grupo prioritário?",
    a: "Apenas profissionais de saúde", b: "Crianças 6m–5 anos, gestantes, idosos ≥60 anos e profissionais de saúde", c: "Apenas pessoas com doenças crônicas", d: "Somente gestantes e idosos >70 anos", ans: "b",
  },
  {
    cat: "Vacinas e Imunização", diff: "dificil", time: 60,
    q: "Vacina atenuada fora da cadeia de frio por 2h a 25°C. Qual a conduta correta?",
    a: "Utilizar normalmente", b: "Marcar e usar no mesmo dia", c: "Descartar e notificar supervisão", d: "Recolocar na geladeira e aguardar", ans: "c",
  },
  // Técnica de Administração — técnicos (facil/media)
  {
    cat: "Técnica de Administração", diff: "facil", time: 30,
    q: "Qual material é obrigatório usar ao manipular vacinas para evitar contaminação?",
    a: "Avental e óculos", b: "Luvas de procedimento", c: "Máscara N95", d: "Capote estéril", ans: "b",
  },
  {
    cat: "Técnica de Administração", diff: "facil", time: 30,
    q: "Em crianças menores de 2 anos, o local preferencial para injeção IM de vacinas é:",
    a: "Glúteo máximo", b: "Deltóide", c: "Vasto lateral da coxa", d: "Glúteo médio", ans: "c",
  },
  {
    cat: "Técnica de Administração", diff: "media", time: 45,
    q: "O que deve ser feito imediatamente antes de aplicar uma vacina injetável?",
    a: "Agitar vigorosamente o frasco", b: "Aspirar e verificar turbidez ou partículas", c: "Aquecer o frasco na mão por 5 min", d: "Inspecionar visualmente e conferir validade", ans: "d",
  },
  {
    cat: "Técnica de Administração", diff: "facil", time: 30,
    q: "Qual o ângulo correto de inserção da agulha para aplicação subcutânea?",
    a: "90 graus", b: "45 graus", c: "15 graus", d: "5 graus", ans: "b",
  },
  {
    cat: "Técnica de Administração", diff: "media", time: 45,
    q: "O que significa o termo 'cadeia de frio' na vacinação?",
    a: "Sequência de vacinas no mesmo dia", b: "Sistema de conservação entre +2°C e +8°C do fabricante ao usuário", c: "Protocolo de descarte de seringas", d: "Ordem de prioridade de atendimento", ans: "b",
  },
  {
    cat: "Técnica de Administração", diff: "facil", time: 30,
    q: "Após a aplicação de vacina, onde descartar agulha e seringa?",
    a: "Saco plástico comum", b: "Lixo orgânico", c: "Coletor de material perfurocortante (descarpak)", d: "Recipiente com tampa no lavatório", ans: "c",
  },
  {
    cat: "Técnica de Administração", diff: "media", time: 45,
    q: "Conduta correta quando usuário apresenta lipotimia após vacinação:",
    a: "Aplicar adrenalina imediatamente", b: "Deitar com MMII elevados e monitorar sinais vitais", c: "Chamar SAMU sem intervir", d: "Oferecer água com açúcar sentado", ans: "b",
  },
  {
    cat: "Técnica de Administração", diff: "facil", time: 30,
    q: "O cartão de vacinas deve ser consultado antes da aplicação para:",
    a: "Conferir se está em jejum", b: "Verificar histórico vacinal e evitar doses duplicadas", c: "Confirmar peso e altura", d: "Checar plano de saúde", ans: "b",
  },
  // Farmacologia
  {
    cat: "Farmacologia", diff: "media", time: 45,
    q: "A adrenalina utilizada no tratamento da anafilaxia tem qual concentração para uso IM?",
    a: "1:100", b: "1:1000", c: "1:10000", d: "1:100000", ans: "b",
  },
  {
    cat: "Farmacologia", diff: "media", time: 45,
    q: "Qual classe farmacológica é usada como segunda linha no tratamento da anafilaxia?",
    a: "Antifúngicos", b: "Anti-histamínicos", c: "Antivirais", d: "Antihipertensivos", ans: "b",
  },
  // Biossegurança
  {
    cat: "Biossegurança", diff: "facil", time: 30,
    q: "O que deve ser feito após acidentes com material biológico perfurocortante?",
    a: "Lavar com álcool 70% e ignorar", b: "Lavar com água e sabão, notificar e buscar atendimento médico", c: "Aplicar curativo e continuar trabalhando", d: "Aguardar 24h para avaliar", ans: "b",
  },
  {
    cat: "Biossegurança", diff: "facil", time: 30,
    q: "O que é Equipamento de Proteção Individual (EPI) no contexto de vacinação?",
    a: "Equipamento para emergências de incêndio", b: "Equipamento que protege o trabalhador de riscos à saúde", c: "Software de gestão de saúde", d: "Kit de primeiros socorros", ans: "b",
  },
];

const questionsToInsert = questionDefs.map((qd) => ({
  category_id: catMap[qd.cat],
  difficulty: qd.diff,
  question_text: qd.q,
  option_a: qd.a,
  option_b: qd.b,
  option_c: qd.c,
  option_d: qd.d,
  time_limit_seconds: qd.time,
  active: true,
}));

const { data: questions, error: qErr } = await sb
  .from("questions")
  .insert(questionsToInsert)
  .select();
if (qErr) { console.error(qErr); process.exit(1); }
console.log(`  inserted ${questions.length} questions`);

// Insert answers
const answersToInsert = questions.map((q, i) => ({
  question_id: q.id,
  correct_option: questionDefs[i].ans,
}));
const { error: ansErr } = await sb.from("question_answers").insert(answersToInsert);
if (ansErr) { console.error(ansErr); process.exit(1); }
console.log(`  inserted ${answersToInsert.length} answers`);

// ── 4. WEEKLY SCHEDULE ───────────────────────────────────────────────────────
console.log("\nCreating weekly schedule...");
const { data: weekStartData } = await sb.rpc("current_week_start");
const weekStart = weekStartData;
console.log("  week_start:", weekStart);

// Get admin profile to set as created_by
const { data: adminList } = await sb.auth.admin.listUsers({ perPage: 10 });
const adminUser = adminList?.users?.find(
  (u) => u.user_metadata?.role === "admin" || u.email?.includes("admin")
);

const { data: schedule, error: schedErr } = await sb
  .from("weekly_schedules")
  .insert({ week_start: weekStart, created_by: adminUser?.id ?? questions[0]?.id })
  .select()
  .single();
if (schedErr) { console.error(schedErr); process.exit(1); }

// Add first 10 active questions to schedule
const activeQIds = questions.slice(0, 10).map((q) => ({
  schedule_id: schedule.id,
  question_id: q.id,
}));
const { error: sqErr } = await sb.from("schedule_questions").insert(activeQIds);
if (sqErr) console.warn("  schedule_questions:", sqErr.message);
else console.log(`  added ${activeQIds.length} questions to schedule`);

// ── 5. USERS ─────────────────────────────────────────────────────────────────
console.log("\nEnsuring users...");

const userDefs = [
  { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: "Administrador", role: "admin" },
  { email: "maria@saude.com", password: "maria123", name: "Maria Santos", role: "user" },
  { email: "joao@saude.com", password: "joao123", name: "João Silva", role: "user" },
  { email: "ana@saude.com", password: "ana123", name: "Ana Oliveira", role: "user" },
  { email: "carlos@saude.com", password: "carlos123", name: "Carlos Lima", role: "user" },
  { email: "fernanda@saude.com", password: "fernanda123", name: "Fernanda Costa", role: "user" },
  { email: "patricia@saude.com", password: "patricia123", name: "Patrícia Alves", role: "user" },
  { email: "roberto@saude.com", password: "roberto123", name: "Roberto Souza", role: "user" },
  { email: "lucas@saude.com", password: "lucas123", name: "Lucas Ferreira", role: "user" },
  { email: "camila@saude.com", password: "camila123", name: "Camila Rocha", role: "user" },
  { email: process.env.USER_EMAIL, password: process.env.USER_PASSWORD, name: "Usuário Teste", role: "user" },
];

const userIds = {};
for (const u of userDefs) {
  if (!u.email || !u.password) continue;
  let uid;
  const { data: created, error: ce } = await sb.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.name },
  });
  if (ce) {
    if (ce.code === "email_exists") {
      const { data: list } = await sb.auth.admin.listUsers({ perPage: 50 });
      uid = list?.users?.find((x) => x.email === u.email)?.id;
    } else {
      console.warn(`  ${u.email}: ${ce.message}`);
      continue;
    }
  } else {
    uid = created.user.id;
  }
  if (!uid) continue;
  await sb.from("profiles").update({ role: u.role, full_name: u.name }).eq("id", uid);
  userIds[u.name] = uid;
  console.log(`  ${u.email} [${u.role}]`);
}

// ── 6. QUIZ ATTEMPTS (ranking seed) ──────────────────────────────────────────
console.log("\nCreating quiz attempts...");

// Helper: week_start for N weeks ago
function prevWeekStart(weeksAgo) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

// Ranking data per user: [name, score, timeSec]
// Current week
const currentWeekData = [
  ["Maria Santos", 145, 342],
  ["João Silva", 132, 298],
  ["Ana Oliveira", 128, 415],
  ["Carlos Lima", 115, 287],
  ["Fernanda Costa", 98, 356],
  ["Patrícia Alves", 87, 390],
  ["Roberto Souza", 81, 455],
  ["Lucas Ferreira", 75, 480],
];

// Previous weeks (for monthly data)
const prevWeeks = [
  {
    ws: prevWeekStart(1),
    data: [
      ["Maria Santos", 140, 360],
      ["Ana Oliveira", 135, 320],
      ["João Silva", 120, 310],
      ["Carlos Lima", 105, 300],
      ["Fernanda Costa", 92, 370],
      ["Patrícia Alves", 80, 400],
    ],
  },
  {
    ws: prevWeekStart(2),
    data: [
      ["Carlos Lima", 150, 280],
      ["Maria Santos", 130, 350],
      ["Ana Oliveira", 125, 400],
      ["João Silva", 110, 330],
      ["Roberto Souza", 95, 410],
    ],
  },
  {
    ws: prevWeekStart(3),
    data: [
      ["Ana Oliveira", 145, 330],
      ["Carlos Lima", 138, 290],
      ["Maria Santos", 120, 370],
      ["João Silva", 115, 340],
      ["Lucas Ferreira", 88, 460],
    ],
  },
  // ~2 months ago
  {
    ws: prevWeekStart(8),
    data: [
      ["Carlos Lima", 142, 295],
      ["Ana Oliveira", 130, 340],
      ["Maria Santos", 125, 360],
      ["João Silva", 118, 325],
      ["Fernanda Costa", 98, 380],
    ],
  },
  {
    ws: prevWeekStart(12),
    data: [
      ["Carlos Lima", 148, 280],
      ["Maria Santos", 135, 345],
      ["Ana Oliveira", 128, 395],
      ["Patrícia Alves", 112, 370],
    ],
  },
];

let attemptCount = 0;

async function insertAttempts(ws, dataRows) {
  for (const [name, score, timeSec] of dataRows) {
    const uid = userIds[name];
    if (!uid) { console.warn(`  no uid for ${name}`); continue; }
    const startedAt = new Date(`${ws}T08:00:00Z`);
    const finishedAt = new Date(startedAt.getTime() + timeSec * 1000);
    const { data: att, error } = await sb
      .from("quiz_attempts")
      .insert({
        user_id: uid,
        week_start: ws,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        total_score: score,
        status: "completed",
      })
      .select()
      .single();
    if (error) {
      console.warn(`  attempt ${name} ${ws}: ${error.message}`);
      continue;
    }
    attemptCount++;

    // Create simple answer records (randomly correct/incorrect matching score)
    const schedQIds = questions.slice(0, 10).map((q) => q.id);
    const pointsPerQ = [15, 15, 10, 10, 15, 15, 10, 10, 10, 10]; // points if correct
    let accumulated = 0;
    const answers = schedQIds.map((qid, idx) => {
      const points = pointsPerQ[idx] ?? 10;
      const willBeCorrect = accumulated + points <= score;
      if (willBeCorrect) accumulated += points;
      return {
        attempt_id: att.id,
        question_id: qid,
        selected_option: willBeCorrect ? questionDefs[idx].ans : (questionDefs[idx].ans === "a" ? "b" : "a"),
        is_correct: willBeCorrect,
        points_awarded: willBeCorrect ? points : 0,
        time_taken_seconds: Math.round(timeSec / schedQIds.length),
      };
    });
    await sb.from("attempt_answers").insert(answers);
  }
}

await insertAttempts(weekStart, currentWeekData);
for (const w of prevWeeks) {
  await insertAttempts(w.ws, w.data);
}

console.log(`  inserted ${attemptCount} attempts`);
console.log("\nSeed complete!");
