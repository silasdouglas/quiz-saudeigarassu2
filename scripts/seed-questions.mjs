import { createClient } from '/home/pni/Dev/quiz-saudeigarassu2/node_modules/@supabase/supabase-js/dist/index.mjs'

const supabase = createClient(
  'https://gmwkzqfksfdmmogexuvq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2t6cWZrc2ZkbW1vZ2V4dXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0OTQyOSwiZXhwIjoyMDkzOTI1NDI5fQ.MmRHhb2x6YuEGj_dXdR4ohlJM1Upw36_JuSGA67O_UI'
)

const ADMIN_ID = '2dc15e0a-8f9c-42a2-8710-f84f62239fc4'

// ── 1. LIMPAR BANCO ─────────────────────────────────────────────────────────
console.log('Limpando dados...')
await supabase.from('attempt_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
await supabase.from('schedule_questions').delete().neq('schedule_id', '00000000-0000-0000-0000-000000000000')
await supabase.from('question_answers').delete().neq('question_id', '00000000-0000-0000-0000-000000000000')
await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
console.log('Banco limpo.')

// ── 2. CRIAR CATEGORIAS ──────────────────────────────────────────────────────
const categories = [
  { slug: 'esf',        name: 'ESF',                       description: 'Estratégia Saúde da Família' },
  { slug: 'imunizacao', name: 'Imunização',                description: 'Calendário e técnica vacinal' },
  { slug: 'diabetes',   name: 'Diabetes',                  description: 'Diabetes mellitus na AB' },
  { slug: 'prenatal',   name: 'Pré-natal',                 description: 'Assistência pré-natal' },
  { slug: 'vigilancia', name: 'Vigilância Epidemiológica', description: 'Notificação e controle de doenças' },
  { slug: 'crianca',    name: 'Saúde da Criança',          description: 'Crescimento e desenvolvimento infantil' },
  { slug: 'mulher',     name: 'Saúde da Mulher',           description: 'Prevenção e atenção à saúde da mulher' },
  { slug: 'aidpi',      name: 'AIDPI',                     description: 'Atenção Integrada às Doenças Prevalentes na Infância' },
  { slug: 'pec',        name: 'PEC',                       description: 'Prontuário Eletrônico do Cidadão / e-SUS' },
]

const { data: cats, error: catErr } = await supabase
  .from('categories')
  .insert(categories.map(({ name, description }) => ({ name, description })))
  .select('id, name')

if (catErr) { console.error('Erro ao criar categorias:', catErr.message); process.exit(1) }
console.log('Categorias criadas:', cats.map(c => c.name).join(', '))

const catId = {}
for (const cat of cats) {
  const slug = categories.find(c => c.name === cat.name)?.slug
  catId[slug] = cat.id
}

// ── 3. PERGUNTAS ─────────────────────────────────────────────────────────────
// Formato: [question_text, option_a, option_b, option_c, option_d, correct, difficulty]
const data = {
  esf: [
    ['Qual é o número mínimo de famílias recomendadas para uma equipe de Saúde da Família?',
     '500 a 1.000 famílias', '2.000 a 3.500 famílias', '5.000 a 7.000 famílias', '10.000 a 15.000 famílias', 'b', 'facil'],
    ['Qual profissional NÃO compõe a equipe mínima da ESF?',
     'Médico generalista', 'Enfermeiro', 'Técnico de enfermagem', 'Fisioterapeuta', 'd', 'facil'],
    ['O Agente Comunitário de Saúde deve realizar visita domiciliar com qual periodicidade mínima?',
     'Semanalmente', 'Mensalmente', 'Bimestralmente', 'Trimestralmente', 'b', 'facil'],
    ['O acolhimento na ESF é definido como:',
     'Triagem para urgências', 'Recepção administrativa do usuário', 'Postura de escuta qualificada e responsabilização pelos problemas de saúde', 'Encaminhamento para especialistas', 'c', 'facil'],
    ['O NASF-AB tem como principal função:',
     'Substituir a equipe de Saúde da Família', 'Apoiar e ampliar a qualidade da atenção oferecida pelas equipes de SF', 'Realizar consultas de especialidades médicas', 'Gerenciar os prontuários eletrônicos', 'b', 'media'],
    ['Quantos ACS compõem, no máximo, uma equipe de Saúde da Família?',
     '4 ACS', '6 ACS', '12 ACS', '20 ACS', 'c', 'media'],
    ['O técnico de enfermagem na ESF pode realizar qual procedimento sem supervisão direta do enfermeiro?',
     'Prescrição de medicamentos', 'Curativos simples de baixa complexidade', 'Interpretação de exames laboratoriais', 'Diagnóstico de enfermagem', 'b', 'media'],
    ['O Cadastro Individual no e-SUS PEC é responsabilidade primária de qual profissional da ESF?',
     'Médico', 'Enfermeiro', 'Agente Comunitário de Saúde', 'Técnico de enfermagem', 'c', 'media'],
    ['O principal objetivo da ESF é:',
     'Reduzir custos hospitalares', 'Reorientar o modelo assistencial para a atenção básica com foco na família e comunidade', 'Aumentar a cobertura de consultas especializadas', 'Substituir os hospitais regionais', 'b', 'dificil'],
    ['A Política Nacional de Atenção Básica (PNAB) define como atributo essencial da APS:',
     'Especialização em doenças crônicas', 'Longitudinalidade do cuidado', 'Encaminhamento preferencial a especialistas', 'Atendimento exclusivo por médicos', 'b', 'dificil'],
  ],

  imunizacao: [
    ['Qual é a via de administração da vacina BCG?',
     'Intramuscular', 'Subcutânea', 'Intradérmica', 'Oral', 'c', 'facil'],
    ['A vacina Pentavalente protege contra quais doenças?',
     'Polio, sarampo, caxumba, rubéola e varicela', 'Difteria, tétano, coqueluche, hepatite B e Haemophilus influenzae b', 'Meningite, pneumonia, febre amarela, dengue e HPV', 'Tuberculose, febre tifoide, cólera, influenza e hepatite A', 'b', 'facil'],
    ['A temperatura recomendada para armazenamento das vacinas na rede de frio é:',
     '0°C a 4°C', '+2°C a +8°C', '−10°C a −20°C', '8°C a 15°C', 'b', 'facil'],
    ['Qual vacina é CONTRAINDICADA para gestantes?',
     'Influenza inativada', 'Hepatite B', 'dT (dupla adulto)', 'Febre amarela (exceto em situações de risco)', 'd', 'facil'],
    ['O local preferencial para aplicação intramuscular de vacinas em crianças menores de 2 anos é:',
     'Glúteo máximo', 'Deltóide', 'Vasto lateral da coxa', 'Região dorso-glútea', 'c', 'media'],
    ['Após abertura de frasco multidose sem conservante, o prazo máximo de utilização é:',
     '12 horas', '24 horas', '4 horas', '48 horas', 'c', 'media'],
    ['A vacina BCG, após reconstituição, deve ser utilizada em até:',
     '24 horas', '12 horas', '6 horas', '2 horas', 'c', 'media'],
    ['Após aplicação de vacina injetável, o usuário deve ser observado por quanto tempo mínimo na unidade?',
     '5 minutos', '15 minutos', '30 minutos', '60 minutos', 'c', 'media'],
    ['Qual é a via de administração da vacina contra influenza sazonal?',
     'Oral', 'Intradérmica', 'Intramuscular', 'Subcutânea', 'c', 'dificil'],
    ['A vacina VIP (Poliomielite Inativada) substituiu a VOP nas doses primárias do calendário nacional pois:',
     'É mais barata de produzir', 'Elimina o risco de poliomielite associada à vacina oral', 'Tem maior duração de imunidade', 'Pode ser administrada por via oral', 'b', 'dificil'],
  ],

  diabetes: [
    ['O valor de glicemia em jejum que confirma diagnóstico de Diabetes Mellitus é:',
     '≥ 100 mg/dL', '≥ 126 mg/dL', '≥ 140 mg/dL', '≥ 200 mg/dL somente com sintomas', 'b', 'facil'],
    ['Qual sinal é característico de hipoglicemia?',
     'Poliúria e polidipsia', 'Pele seca e rubor facial', 'Sudorese fria, tremores e confusão mental', 'Hálito cetônico e respiração de Kussmaul', 'c', 'facil'],
    ['Ao realizar glicosimetria, o técnico de enfermagem deve:',
     'Usar a primeira gota de sangue diretamente', 'Descartar a primeira gota (limpar) e usar a segunda', 'Apertar fortemente o dedo para maior volume', 'Sempre utilizar o lobo da orelha', 'b', 'facil'],
    ['A insulina NPH deve ser armazenada (frasco em uso):',
     'Congelada a −20°C', 'Refrigerada entre 2°C e 8°C (frasco fechado)', 'Em temperatura ambiente, longe da luz, por até 28 dias', 'Qualquer temperatura desde que abaixo de 30°C', 'c', 'facil'],
    ['Qual exame avalia o controle glicêmico dos últimos 2 a 3 meses?',
     'Glicemia de jejum', 'Glicemia pós-prandial', 'Hemoglobina glicada (HbA1c)', 'Teste de tolerância à glicose (TOTG)', 'c', 'media'],
    ['A insulina rápida (regular) deve ser aplicada:',
     '1 hora antes das refeições', '15 a 30 minutos antes das refeições', 'Imediatamente após as refeições', '2 horas após as refeições', 'b', 'media'],
    ['Qual sinal NÃO é característico de hiperglicemia?',
     'Poliúria', 'Polidipsia', 'Polifagia', 'Sudorese fria e tremores', 'd', 'media'],
    ['O pé diabético é uma complicação relacionada principalmente a:',
     'Hipertensão arterial não controlada', 'Neuropatia periférica e insuficiência vascular periférica', 'Doença renal crônica avançada', 'Retinopatia diabética', 'b', 'media'],
    ['A meta de HbA1c para a maioria dos pacientes com DM2 no controle ambulatorial é:',
     '< 5,7%', '< 7%', '< 9%', '< 10%', 'b', 'dificil'],
    ['Para o paciente diabético em uso de metformina, qual função deve ser monitorada periodicamente?',
     'Função tireoidiana (TSH)', 'Função hepática (TGO/TGP)', 'Função renal (creatinina e TFG)', 'Hemograma completo', 'c', 'dificil'],
  ],

  prenatal: [
    ['Qual é o número mínimo de consultas de pré-natal recomendadas pelo Ministério da Saúde?',
     '4 consultas', '6 consultas', '8 consultas', '12 consultas', 'b', 'facil'],
    ['A 1ª consulta de pré-natal deve ser realizada, idealmente, até:',
     '8ª semana de gestação', '12ª semana de gestação', '16ª semana de gestação', '20ª semana de gestação', 'b', 'facil'],
    ['O ácido fólico na gestação tem como principal função prevenir:',
     'Anemia ferropriva', 'Defeitos do tubo neural', 'Diabetes gestacional', 'Hipertensão gestacional', 'b', 'facil'],
    ['Qual vacina é recomendada para TODAS as gestantes?',
     'Febre amarela', 'MMR (tríplice viral)', 'dTpa (difteria, tétano e coqueluche acelular)', 'Varicela', 'c', 'facil'],
    ['O sulfato ferroso na gestação é prescrito a partir de qual semana gestacional?',
     '12ª semana', '16ª semana', '20ª semana', '28ª semana', 'c', 'media'],
    ['A pressão arterial diagnóstica para pré-eclâmpsia é:',
     'PA ≥ 130/85 mmHg', 'PA ≥ 140/90 mmHg', 'PA ≥ 160/110 mmHg', 'PA ≥ 120/80 mmHg', 'b', 'media'],
    ['O edema fisiológico na gestação caracteriza-se por ser:',
     'Generalizado, com cacifo em face e mãos pela manhã', 'Restrito aos membros inferiores, piora ao final do dia', 'Localizado apenas na face', 'Associado à proteinúria', 'b', 'media'],
    ['O Teste de Tolerância à Glicose 75g (TOTG) na gestação rastreia:',
     'Hipertireoidismo gestacional', 'Diabetes mellitus gestacional', 'Anemia falciforme', 'Infecção urinária assintomática', 'b', 'media'],
    ['A altura uterina (AU) esperada ao redor de 40 semanas gestacionais é de aproximadamente:',
     '28 a 30 cm', '32 a 34 cm', '36 a 42 cm (próxima ao apêndice xifoide)', '20 a 24 cm', 'c', 'dificil'],
    ['Na consulta de pré-natal, o exame de Papanicolau:',
     'É contraindicado durante toda a gestação', 'Deve ser coletado apenas no primeiro trimestre', 'Pode ser coletado em qualquer trimestre se não houver contraindicação', 'Só é realizado após o parto', 'c', 'dificil'],
  ],

  vigilancia: [
    ['Qual sistema é utilizado para notificação de doenças de notificação compulsória?',
     'SINAN', 'SIS-Pré-natal', 'e-SUS PEC', 'SISVAN', 'a', 'facil'],
    ['O prazo para notificação de doenças de notificação compulsória IMEDIATA (DNCI) é:',
     '7 dias corridos', '24 horas', '48 horas', '72 horas', 'b', 'facil'],
    ['Qual doença NÃO é de notificação compulsória no Brasil?',
     'Dengue', 'Tuberculose', 'Hipertensão arterial', 'HIV/AIDS', 'c', 'facil'],
    ['O período de incubação é definido como:',
     'Tempo em que o paciente transmite a doença', 'Tempo entre a exposição ao agente e o início dos sintomas', 'Duração total da doença', 'Intervalo entre dois surtos epidêmicos', 'b', 'facil'],
    ['A taxa de incidência mede:',
     'Número de casos existentes em determinado momento na população', 'Número de casos novos em relação à população suscetível em um período', 'Número de óbitos por determinada doença', 'Proporção de casos graves em relação ao total', 'b', 'media'],
    ['A prevalência é o indicador que mede:',
     'Casos novos de doença em um período', 'Frequência de casos (existentes e novos) de doença na população em determinado momento', 'Risco de morte por doença específica', 'Velocidade de transmissão de uma doença', 'b', 'media'],
    ['Na investigação de caso suspeito de dengue, o técnico de enfermagem deve:',
     'Aguardar confirmação laboratorial para notificar', 'Notificar apenas casos confirmados por NS1', 'Notificar o caso suspeito imediatamente', 'Encaminhar diretamente ao pronto-socorro', 'c', 'media'],
    ['A principal medida de controle do Aedes aegypti na atenção básica é:',
     'Fumacê (nebulização de inseticida)', 'Uso de repelentes pela população', 'Eliminação dos criadouros (controle do vetor no domicílio)', 'Vacinação em massa', 'c', 'media'],
    ['A notificação negativa em epidemiologia significa:',
     'Notificação de caso com resultado de exame negativo', 'Confirmação periódica de que não ocorreram casos de doenças compulsórias', 'Cancelamento de notificação anteriormente realizada', 'Notificação de óbito sem causa determinada', 'b', 'dificil'],
    ['A investigação epidemiológica de um surto tem como objetivo principal:',
     'Punir os responsáveis pelo surto', 'Identificar a fonte de infecção e interromper a cadeia de transmissão', 'Divulgar os casos na mídia local', 'Isolar todos os contatos domiciliares imediatamente', 'b', 'dificil'],
  ],

  crianca: [
    ['A alimentação complementar deve ser introduzida a partir de:',
     '4 meses', '6 meses', '8 meses', '12 meses', 'b', 'facil'],
    ['O Teste do Pezinho (Triagem Neonatal) deve ser realizado entre:',
     '1° e 2° dia de vida', '3° e 5° dia de vida', '7° e 10° dia de vida', '30° dia de vida', 'b', 'facil'],
    ['O teste do reflexo vermelho (Teste do Olhinho) avalia:',
     'Acuidade visual', 'Opacidades nos meios oculares (possível catarata congênita)', 'Pressão intraocular', 'Motricidade ocular extrínseca', 'b', 'facil'],
    ['Qual é o sinal clínico mais precoce de desidratação em crianças?',
     'Ausência de diurese', 'Fontanela deprimida', 'Mucosas secas e sede', 'Hipotensão arterial', 'c', 'facil'],
    ['A curva de crescimento utilizada para avaliação nutricional de crianças menores de 5 anos é da:',
     'OPAS (2007)', 'OMS (2006)', 'CDC (EUA)', 'Ministério da Saúde (2002)', 'b', 'media'],
    ['O desenvolvimento neuropsicomotor esperado para uma criança de 6 meses inclui:',
     'Andar sem apoio', 'Falar palavras soltas', 'Sentar com apoio e rolar', 'Construir torres com cubos', 'c', 'media'],
    ['O índice utilizado para avaliar a desnutrição AGUDA em crianças é:',
     'Peso para a idade (P/I)', 'Altura para a idade (A/I)', 'Peso para a altura (P/A)', 'Perímetro cefálico para a idade', 'c', 'media'],
    ['Qual sinal indica possível desidratação grave em lactentes?',
     'Choro com lágrimas abundantes', 'Fontanela abaulada', 'Fontanela deprimida, olhos fundos e turgor cutâneo lentificado', 'Diurese normal', 'c', 'media'],
    ['A suplementação de vitamina D em lactentes amamentados exclusivamente deve ser iniciada:',
     'Ao nascimento até os 24 meses', 'Após o 1° mês', 'Após o 6° mês', 'Apenas se exposição solar insuficiente detectada em exame', 'a', 'dificil'],
    ['A caderneta de saúde da criança é instrumento fundamental para:',
     'Solicitação de exames laboratoriais de rotina', 'Acompanhamento longitudinal do crescimento, desenvolvimento e vacinação', 'Emissão de atestados de saúde escolar', 'Controle de estoque de medicamentos pediátricos', 'b', 'dificil'],
  ],

  mulher: [
    ['A coleta do exame de Papanicolau deve ser iniciada em mulheres, segundo o MS:',
     'A partir de 18 anos', 'A partir de 21 anos', 'A partir de 25 anos sexualmente ativas', 'No início da atividade sexual, independente da idade', 'c', 'facil'],
    ['O corrimento vaginal com odor de "peixe podre", homogêneo e acinzentado é característico de:',
     'Candidíase vaginal', 'Tricomoníase', 'Vaginose bacteriana', 'Gonorreia', 'c', 'facil'],
    ['Os principais fatores de risco para câncer de colo do útero são:',
     'Tabagismo e obesidade', 'Infecção pelo HPV e múltiplos parceiros sexuais', 'Histórico familiar e uso de anticoncepcionais', 'Sedentarismo e consumo de álcool', 'b', 'facil'],
    ['A mamografia de rastreamento é recomendada pelo MS/INCA para mulheres:',
     'A partir de 35 anos, anualmente', 'De 40 a 49 anos, anualmente', 'De 50 a 69 anos, a cada 2 anos', 'A partir de 60 anos, anualmente', 'c', 'facil'],
    ['A periodicidade recomendada do Papanicolau após dois resultados normais consecutivos é:',
     'Anual', 'A cada 2 anos', 'A cada 3 anos', 'A cada 5 anos', 'c', 'media'],
    ['O autoexame das mamas deve ser realizado:',
     'Durante a menstruação', 'A qualquer momento sem periodicidade específica', '7 a 10 dias após o início da menstruação', 'Apenas quando há sintomas suspeitos', 'c', 'media'],
    ['A menopausa é definida como:',
     'Redução da frequência menstrual', 'Ausência de menstruação por 12 meses consecutivos', 'Término da fase fértil após os 40 anos', 'Elevação dos níveis de estrogênio', 'b', 'media'],
    ['A oftalmia neonatal (conjuntivite do recém-nascido) que pode evoluir para cegueira é causada principalmente por:',
     'Treponema pallidum (sífilis)', 'Neisseria gonorrhoeae', 'Chlamydia trachomatis', 'Herpesvírus', 'b', 'media'],
    ['O DIU de cobre tem como mecanismo de ação principal:',
     'Inibição da ovulação', 'Espessamento do muco cervical', 'Efeito espermicida e alteração do muco e endométrio', 'Bloqueio hormonal da implantação', 'c', 'dificil'],
    ['A violência obstétrica INCLUI:',
     'Monitoramento fetal eletrônico contínuo', 'Episiotomia de rotina sem indicação clínica', 'Analgesia de parto solicitada pela parturiente', 'Presença de acompanhante durante o parto', 'b', 'dificil'],
  ],

  aidpi: [
    ['A estratégia AIDPI avalia crianças em qual faixa etária?',
     '0 a 2 meses', '2 meses a 5 anos (2 a 59 meses)', '1 a 10 anos', '0 a 15 anos', 'b', 'facil'],
    ['Os "sinais gerais de perigo" na AIDPI incluem:',
     'Febre sem foco identificado', 'Incapacidade de beber ou mamar, vômitos persistentes, convulsões e letargia', 'Tosse há mais de 2 semanas', 'Diarreia há mais de 3 dias', 'b', 'facil'],
    ['A frequência respiratória considerada taquipneia para crianças de 2 a 12 meses é:',
     '≥ 40 irpm', '≥ 50 irpm', '≥ 60 irpm', '≥ 30 irpm', 'b', 'facil'],
    ['A estratégia AIDPI foi desenvolvida por:',
     'Ministério da Saúde do Brasil exclusivamente', 'OMS e UNICEF', 'OPAS e Banco Mundial', 'Sociedade Brasileira de Pediatria', 'b', 'facil'],
    ['Na AIDPI, criança com tiragem subcostal apresenta classificação de:',
     'Pneumonia grave ou doença muito grave — referenciar urgente', 'Pneumonia leve — tratar ambulatorialmente', 'Sem pneumonia: tosse ou resfriado', 'Asma brônquica provável', 'a', 'media'],
    ['O plano B de reidratação na diarreia (AIDPI) consiste em:',
     'Soro fisiológico intravenoso hospitalar', 'Terapia de reidratação oral (TRO) supervisionada na unidade de saúde', 'Antibiótico oral por 5 dias', 'Internação hospitalar imediata', 'b', 'media'],
    ['Criança com febre e rigidez de nuca na AIDPI é classificada como:',
     'Febre — possível infecção bacteriana simples', 'Malária grave', 'Doença febril muito grave (possível meningite) — referenciar urgente', 'Febre sem foco', 'c', 'media'],
    ['O técnico de enfermagem ao identificar sinal geral de perigo pela AIDPI deve:',
     'Tratar e dispensar a criança', 'Aguardar consulta médica de rotina', 'Referenciar urgentemente ao hospital', 'Prescrever antibiótico profilático', 'c', 'media'],
    ['Na avaliação nutricional pela AIDPI, criança com Peso/Altura (P/A) abaixo de −3 desvios-padrão é classificada como:',
     'Risco nutricional leve', 'Desnutrição aguda grave', 'Obesidade', 'Estatura baixa para a idade', 'b', 'dificil'],
    ['A estridor em repouso na criança avaliada pela AIDPI indica:',
     'Rinite alérgica moderada', 'Doença febril muito grave ou obstrução grave de vias aéreas — referenciar urgente', 'Pneumonia leve tratável ambulatorialmente', 'Bronquiolite leve sem complicações', 'b', 'dificil'],
  ],

  pec: [
    ['O PEC faz parte de qual sistema nacional?',
     'SINAN', 'e-SUS Atenção Básica (e-SUS AB)', 'SISVAN', 'SISPRENATAL', 'b', 'facil'],
    ['A CIAP-2 utilizada no PEC serve para classificar:',
     'Diagnósticos hospitalares complexos', 'Procedimentos cirúrgicos de alta complexidade', 'Problemas e motivos de consulta na atenção primária', 'Medicamentos e doses prescritas', 'c', 'facil'],
    ['O cadastro domiciliar no e-SUS PEC é responsabilidade primária do:',
     'Médico da equipe', 'Técnico de enfermagem', 'Agente Comunitário de Saúde', 'Enfermeiro coordenador', 'c', 'facil'],
    ['O registro de vacinação no e-SUS PEC alimenta qual sistema nacional?',
     'SISPRENATAL', 'SISVAN', 'SIPNI (Sistema de Informação do PNI)', 'SINASC', 'c', 'facil'],
    ['No PEC, a "lista de problemas" do paciente serve para:',
     'Registrar apenas queixas agudas do dia', 'Manter histórico de condições crônicas e ativas de saúde do usuário', 'Solicitar exames laboratoriais de rotina', 'Controlar medicamentos em uso', 'b', 'media'],
    ['O técnico de enfermagem no PEC pode registrar:',
     'Apenas vacinações aplicadas', 'Atendimentos de enfermagem, vacinações e procedimentos realizados', 'Consultas médicas mediante delegação formal', 'Diagnósticos de enfermagem exclusivamente', 'b', 'media'],
    ['No PEC, qual profissional pode realizar o agendamento de consultas?',
     'Apenas o médico', 'Apenas o enfermeiro', 'Qualquer profissional habilitado com acesso ao sistema', 'Apenas o recepcionista de saúde', 'c', 'media'],
    ['A sincronização dos dados do PEC com a RNDS (Rede Nacional de Dados em Saúde) tem como objetivo:',
     'Substituir completamente os registros em papel', 'Centralizar informações de saúde do cidadão em âmbito nacional', 'Reduzir custos com tecnologia da informação', 'Controlar o acesso a informações sigilosas', 'b', 'media'],
    ['O CBO (Cadastro Brasileiro de Ocupações) no PEC é utilizado para:',
     'Registrar o diagnóstico do paciente', 'Identificar a categoria/ocupação profissional do atendente', 'Controlar o estoque de medicamentos da unidade', 'Agendar consultas e procedimentos', 'b', 'dificil'],
    ['Para registro de atendimento de enfermagem no PEC, o técnico deve utilizar qual classificação para o motivo da consulta?',
     'CID-10 obrigatoriamente', 'CIAP-2 (voltada à atenção primária)', 'CID-11 quando disponível na versão instalada', 'Não é necessário registrar classificação diagnóstica', 'b', 'dificil'],
  ],
}

// ── 4. INSERIR PERGUNTAS ──────────────────────────────────────────────────────
let totalInserted = 0
for (const [slug, questions] of Object.entries(data)) {
  const categoryId = catId[slug]
  for (const [q, a, b, c, d, correct, difficulty] of questions) {
    const { data: qRow, error: qErr } = await supabase
      .from('questions')
      .insert({
        question_text: q,
        option_a: a,
        option_b: b,
        option_c: c,
        option_d: d,
        difficulty,
        category_id: categoryId,
        time_limit_seconds: difficulty === 'facil' ? 45 : difficulty === 'media' ? 60 : 75,
        active: true,
        target_role: 'tecnico_enfermagem',
        created_by: ADMIN_ID,
      })
      .select('id')
      .single()

    if (qErr) { console.error(`Erro em "${q.slice(0,40)}...":`, qErr.message); continue }

    await supabase.from('question_answers').insert({ question_id: qRow.id, correct_option: correct })
    totalInserted++
  }
  console.log(`✓ ${slug}: ${questions.length} perguntas inseridas`)
}

console.log(`\nTotal: ${totalInserted} perguntas inseridas com sucesso.`)
