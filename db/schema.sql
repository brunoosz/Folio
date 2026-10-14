-- Folio — schema draft (não aplicar ainda)
-- Espelha o modelo de dados mock (localStorage) para a migração ao Supabase/Postgres.
-- Todas as tabelas pessoais têm RLS por user_id.
-- Admin enxerga APENAS o catálogo (grupo_muscular, musculo, exercicio, exercicio_musculo).

create table usuario (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nome text,
  role text not null default 'usuario' check (role in ('usuario','admin')),
  created_at timestamptz default now()
);

/* ---------------- Catálogo ---------------- */

create table grupo_muscular (
  id text primary key,          -- ex.: "peito", "quadriceps" (estável)
  nome text not null
);

create table musculo (
  id text primary key,          -- ID anatômico universal e estável (ex.: "peito_superior", "vasto_lateral")
  nome text not null,
  anatomico text,               -- ex.: "Peitoral maior — porção clavicular"
  grupo_id text not null references grupo_muscular(id),
  regiao text not null check (regiao in ('anterior','posterior'))
);

create table exercicio (
  id text primary key,
  nome text not null,
  equipamento text not null,    -- "barra_livre" | "maquina" | "haltere" | "cabo" | "peso_corporal"
  dificuldade text not null,    -- "basico" | "intermediario" | "avancado"
  padrao_movimento text not null, -- define a animação (ex.: "agachamento", "supino")
  postura text not null,        -- "em_pe" | "sentado" | "deitado" | "inclinado" | "apoiado" | "suspenso"
  execucao jsonb not null default '[]',          -- passos (texto)
  estresse jsonb not null,      -- {"lombar":0-2,"joelho":0-2,"ombro":0-2,"cotovelo":0-2}
  ref_1rm_m numeric,            -- 1RM de referência / peso corporal (iniciante), masculino
  ref_1rm_f numeric,            -- idem, feminino
  unilateral boolean default false,
  isometrico boolean default false,
  notas_seguranca text,
  revisado_por_profissional boolean default false,
  criado_por uuid references usuario(id),       -- null = catálogo base
  created_at timestamptz default now()
);

create table exercicio_musculo (
  exercicio_id text references exercicio(id) on delete cascade,
  musculo_id text references musculo(id),
  papel text not null check (papel in ('primario','secundario','estabilizador')),
  primary key (exercicio_id, musculo_id)
);

/* ---------------- Perfil (dados sensíveis — LGPD) ---------------- */

create table perfil_fisico (
  user_id uuid primary key references usuario(id) on delete cascade,
  altura_cm int,
  peso_kg numeric,
  sexo text check (sexo in ('masculino','feminino','outro')),
  idade int,
  experiencia text check (experiencia in ('nunca','iniciante','treina','voltando')),
  objetivo text,
  lesoes text[] default '{}',
  local_treino text,
  consentimento_saude boolean not null default false,
  consentimento_em timestamptz,
  updated_at timestamptz default now()
);

/* ---------------- Treino ---------------- */

create table ficha_modelo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references usuario(id) on delete cascade,
  nome text not null,
  sigla text,
  dia_semana int,               -- 0=dom..6=sab, null=sem dia fixo
  created_at timestamptz default now()
);

create table ficha_modelo_item (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid references ficha_modelo(id) on delete cascade,
  exercicio_id text references exercicio(id),
  ordem int not null,
  series int default 3,
  reps text default '12/10/8',
  esquema text default 'piramide' check (esquema in ('piramide','fixo')),
  descanso_seg int default 90,
  notas text
);

create table sessao_do_dia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references usuario(id) on delete cascade,
  ficha_modelo_id uuid references ficha_modelo(id),
  data date not null,
  status text default 'pendente', -- "pendente" | "em_andamento" | "concluida"
  iniciada_em timestamptz,
  concluida_em timestamptz,
  created_at timestamptz default now()
);

create table sessao_item (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid references sessao_do_dia(id) on delete cascade,
  ficha_item_id uuid references ficha_modelo_item(id),
  exercicio_id text references exercicio(id),
  ordem int not null,
  series int,
  reps text,
  esquema text,
  descanso_seg int,
  carga_kg numeric,             -- maior carga anotada (resumo)
  notas text,
  concluido boolean default false
);

-- Registro série a série (carga, repetições feitas e esforço percebido).
create table serie_log (
  sessao_item_id uuid references sessao_item(id) on delete cascade,
  indice int not null,
  alvo int not null,
  reps int,
  carga_kg numeric,
  esforco text check (esforco in ('leve','limite','falha')),
  feita boolean default false,
  primary key (sessao_item_id, indice)
);

/* ---------------- Rotina ---------------- */

create table agua_registro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references usuario(id) on delete cascade,
  data date not null,
  hora time not null,
  ml int not null
);

create table sono_registro (
  user_id uuid references usuario(id) on delete cascade,
  data date not null,           -- dia em que acordou
  dormiu time not null,
  acordou time not null,
  despertares jsonb default '[]', -- [{"hora":"03:00","minutos":10}]
  qualidade int check (qualidade between 1 and 5),
  notas text,
  primary key (user_id, data)
);

create table habito_registro (
  user_id uuid references usuario(id) on delete cascade,
  habito_id text not null,
  data date not null,
  valor numeric not null default 0,
  primary key (user_id, habito_id, data)
);

create table rotina_atividade (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references usuario(id) on delete cascade,
  hora time not null,
  titulo text not null,
  tipo text not null,
  dias int[] default '{}'       -- vazio = todos os dias
);

create table preferencia_usuario (
  user_id uuid primary key references usuario(id) on delete cascade,
  home_blocos jsonb not null default '[]',
  garrafa_ml int default 500,
  meta_agua_ml int,
  meta_sono_h numeric default 8,
  sobre_mim text,
  tema text default 'claro'
);

/* ---------------- Nutrição ---------------- */

create table refeicao_plano (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references usuario(id) on delete cascade,
  nome text not null,
  hora time,
  itens text[] not null default '{}',
  origem text check (origem in ('nutricionista','proprio')),
  profissional text
);

/* ---------------- RLS (rascunho) ---------------- */
alter table perfil_fisico enable row level security;
alter table ficha_modelo enable row level security;
alter table ficha_modelo_item enable row level security;
alter table sessao_do_dia enable row level security;
alter table sessao_item enable row level security;
alter table serie_log enable row level security;
alter table agua_registro enable row level security;
alter table sono_registro enable row level security;
alter table habito_registro enable row level security;
alter table rotina_atividade enable row level security;
alter table preferencia_usuario enable row level security;
alter table refeicao_plano enable row level security;

-- Política: usuário vê apenas seus dados
-- create policy "user_own" on perfil_fisico for all using (user_id = auth.uid());
-- (aplicar padrão similar em todas as tabelas com user_id; itens/séries via join com o pai)

-- Admin NÃO tem acesso a tabelas pessoais.
-- Admin acessa apenas: grupo_muscular, musculo, exercicio, exercicio_musculo.
-- A chave da IA deve migrar para uma Edge Function (nunca ficar no cliente).
