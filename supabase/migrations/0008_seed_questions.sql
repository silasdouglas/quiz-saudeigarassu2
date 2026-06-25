-- Seed: vaccine questions for nurses (enfermeiros) and nursing techs (técnicos em enfermagem)

-- Insert categories if they don't exist yet
INSERT INTO public.categories (name)
SELECT 'Vacinas e Imunização'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Vacinas e Imunização');

INSERT INTO public.categories (name)
SELECT 'Técnica de Administração'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Técnica de Administração');

-- Temporary function to get category id by name (avoids subquery repetition)
DO $$
DECLARE
  v_vacinas_id  uuid;
  v_tecnica_id  uuid;

  -- question ids (so we can insert answers)
  q1  uuid := gen_random_uuid();
  q2  uuid := gen_random_uuid();
  q3  uuid := gen_random_uuid();
  q4  uuid := gen_random_uuid();
  q5  uuid := gen_random_uuid();
  q6  uuid := gen_random_uuid();
  q7  uuid := gen_random_uuid();
  q8  uuid := gen_random_uuid();
  q9  uuid := gen_random_uuid();
  q10 uuid := gen_random_uuid();
  q11 uuid := gen_random_uuid();
  q12 uuid := gen_random_uuid();
  q13 uuid := gen_random_uuid();
  q14 uuid := gen_random_uuid();
  q15 uuid := gen_random_uuid();
  q16 uuid := gen_random_uuid();
  q17 uuid := gen_random_uuid();
  q18 uuid := gen_random_uuid();
  q19 uuid := gen_random_uuid();
  q20 uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_vacinas_id FROM public.categories WHERE name = 'Vacinas e Imunização' LIMIT 1;
  SELECT id INTO v_tecnica_id FROM public.categories WHERE name = 'Técnica de Administração' LIMIT 1;

  -- ── ENFERMEIROS (media / dificil) ─────────────────────────────────────────

  -- Q1
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q1, v_vacinas_id, 'media',
    'Qual é a temperatura correta para armazenamento da maioria das vacinas inativadas na rede de frio?',
    'Entre -8°C e -2°C',
    'Entre +2°C e +8°C',
    'Entre +8°C e +15°C',
    'Temperatura ambiente (até 25°C)',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q1, 'b');

  -- Q2
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q2, v_vacinas_id, 'media',
    'A vacina BCG deve ser administrada por qual via?',
    'Intramuscular profunda',
    'Subcutânea',
    'Intradérmica',
    'Oral',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q2, 'c');

  -- Q3
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q3, v_vacinas_id, 'dificil',
    'Qual das seguintes é contraindicação absoluta para a vacina tríplice viral (SCR)?',
    'Criança com história de febre após dose anterior',
    'Gestante ou imunodeprimida',
    'Criança com histórico de alergia a ovo',
    'Lactente com 6 meses de idade',
    60, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q3, 'b');

  -- Q4
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q4, v_vacinas_id, 'dificil',
    'Em caso de anafilaxia pós-vacinação, qual é a conduta inicial prioritária do enfermeiro?',
    'Administrar anti-histamínico oral e observar por 30 minutos',
    'Aplicar adrenalina 1:1000 (0,3–0,5 mL) IM na face anterolateral da coxa',
    'Acionar SAMU e aguardar sem intervenção',
    'Administrar corticoide EV e monitorar PA',
    60, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q4, 'b');

  -- Q5
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q5, v_vacinas_id, 'media',
    'O intervalo mínimo recomendado entre duas vacinas de vírus vivos atenuados aplicadas em dias diferentes é de:',
    '7 dias',
    '14 dias',
    '30 dias',
    'Não há intervalo mínimo',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q5, 'c');

  -- Q6
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q6, v_vacinas_id, 'dificil',
    'A vacina Hepatite B quando administrada ao recém-nascido deve ser aplicada em qual prazo após o nascimento?',
    'Até 12 horas de vida',
    'Até 7 dias de vida',
    'Com 1 mês de vida',
    'Apenas ao completar 2 meses de vida',
    60, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q6, 'a');

  -- Q7
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q7, v_vacinas_id, 'media',
    'Qual vacina do calendário infantil é administrada por via oral?',
    'Pneumocócica 10-valente',
    'Rotavírus humano (VORH)',
    'Meningocócica C',
    'Varicela',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q7, 'b');

  -- Q8
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q8, v_vacinas_id, 'dificil',
    'Quanto ao efeito colateral local da vacina DTP, qual das reações a seguir classifica-se como evento adverso grave?',
    'Eritema < 2,5 cm nas primeiras 24 horas',
    'Febre até 38,5°C nas primeiras 48 horas',
    'Abscesso estéril no local de aplicação',
    'Dor leve no sítio de injeção por 1–2 dias',
    60, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q8, 'c');

  -- Q9
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q9, v_vacinas_id, 'media',
    'A vacina influenza é indicada anualmente para qual grupo prioritário dentro das UBS?',
    'Apenas profissionais de saúde',
    'Crianças de 6 meses a 5 anos, gestantes, idosos ≥ 60 anos e profissionais de saúde',
    'Apenas pessoas com doenças crônicas',
    'Somente gestantes e idosos acima de 70 anos',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q9, 'b');

  -- Q10
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q10, v_vacinas_id, 'dificil',
    'Ao verificar que um frasco de vacina atenuada (ex. SCR) permaneceu fora da cadeia de frio por 2 horas a 25°C, a conduta correta é:',
    'Utilizar normalmente, pois a margem é segura',
    'Marcar o frasco e utilizá-lo somente no mesmo dia',
    'Descartar o frasco e notificar a supervisão',
    'Recolocar na geladeira e aguardar o retorno à temperatura correta',
    60, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q10, 'c');

  -- ── TÉCNICOS EM ENFERMAGEM (facil / media) ────────────────────────────────

  -- Q11
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q11, v_tecnica_id, 'facil',
    'Qual material é obrigatório usar ao manipular vacinas para evitar contaminação?',
    'Avental e óculos',
    'Luvas de procedimento',
    'Máscara N95',
    'Capote estéril',
    30, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q11, 'b');

  -- Q12
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q12, v_tecnica_id, 'facil',
    'Após abrir um frasco de vacina, qual é o prazo máximo de uso quando mantido em temperatura adequada e frasco multiodose aberto conforme o PNI?',
    '7 dias',
    '28 dias',
    '4 horas',
    'Até o final do turno (até 6 horas)',
    30, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q12, 'b');

  -- Q13
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q13, v_tecnica_id, 'facil',
    'Em crianças menores de 2 anos, o local preferencial para injeção intramuscular de vacinas é:',
    'Glúteo máximo',
    'Deltóide',
    'Vasto lateral da coxa',
    'Glúteo médio',
    30, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q13, 'c');

  -- Q14
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q14, v_tecnica_id, 'media',
    'O que deve ser feito imediatamente antes de aplicar uma vacina injetável?',
    'Agitar vigorosamente o frasco',
    'Aspirar e verificar se há solução turva ou com partículas',
    'Aquecer o frasco na mão por 5 minutos',
    'Inspecionar visualmente e respeitar o prazo de validade',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q14, 'd');

  -- Q15
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q15, v_tecnica_id, 'facil',
    'Qual o ângulo correto de inserção da agulha para aplicação subcutânea?',
    '90 graus',
    '45 graus',
    '15 graus',
    '5 graus',
    30, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q15, 'b');

  -- Q16
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q16, v_tecnica_id, 'media',
    'O que significa o termo "cadeia de frio" na vacinação?',
    'Sequência de vacinas que precisam ser administradas no mesmo dia',
    'Sistema de conservação que mantém as vacinas entre +2°C e +8°C do fabricante até o usuário',
    'Protocolo de descarte de seringas após uso',
    'Ordem de prioridade de atendimento na sala de vacinas',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q16, 'b');

  -- Q17
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q17, v_tecnica_id, 'facil',
    'Após a aplicação de uma vacina, onde devem ser descartadas agulha e seringa?',
    'Em saco plástico comum',
    'No lixo orgânico',
    'Em coletor de material perfurocortante (descarpak)',
    'Em recipiente com tampa no lavatório',
    30, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q17, 'c');

  -- Q18
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q18, v_tecnica_id, 'media',
    'Qual é a conduta correta quando um usuário apresenta lipotimia (desmaio) logo após a vacinação?',
    'Aplicar adrenalina imediatamente',
    'Deitar o usuário com os membros inferiores elevados e monitorar sinais vitais',
    'Chamar o SAMU sem intervir',
    'Oferecer água com açúcar e deixá-lo sentado',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q18, 'b');

  -- Q19
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q19, v_tecnica_id, 'facil',
    'O cartão de vacinas do usuário deve ser consultado antes da aplicação para:',
    'Conferir se o usuário está em jejum',
    'Verificar o histórico vacinal e evitar doses desnecessárias ou duplicadas',
    'Confirmar o peso e a altura do usuário',
    'Checar o plano de saúde antes de prosseguir',
    30, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q19, 'b');

  -- Q20
  INSERT INTO public.questions (id, category_id, difficulty, question_text, option_a, option_b, option_c, option_d, time_limit_seconds, active)
  VALUES (q20, v_tecnica_id, 'media',
    'Qual é a medida de segurança ao reconhecer que o usuário tem histórico de alergia grave a componente da vacina?',
    'Aplicar metade da dose e observar',
    'Não aplicar a vacina e encaminhar ao médico para avaliação',
    'Aplicar a vacina normalmente, pois alergias leves não contraindicam',
    'Substituir a vacina por outra de fabricante diferente sem consultar o médico',
    45, true);
  INSERT INTO public.question_answers (question_id, correct_option) VALUES (q20, 'b');

END;
$$;
