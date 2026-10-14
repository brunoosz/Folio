-- Folio — schema draft (não aplicar ainda)
-- Todas as tabelas pessoais têm RLS por user_id.
-- Admin enxerga APENAS exercicio, exercicio_musculo e catálogo.

create table usuario (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nome text,
  created_at timestamptz default now()
);

create table musculo (
  id text primary key,  -- ID anatômico universal e estável (ex: "quadriceps_femoris")
  nome text not null,
  grupo text not null,   -- ex: "pernas", "costas"
  regiao text not null   -- "anterior" | "posterior"
);

create table exercicio (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  equipamento text,       -- "barra_livre" | "maquina" | "haltere" | "cabo" | "peso_corporal"
  dificuldade_biomecanica text, -- "basico" | "intermediario" | "avancado"
  notas_seguranca text,
  revisado_por_profissional boolean default false,
  created_at timestamptz default now()
);

create table exercicio_musculo (
  exercicio_id uuid references exercicio(id),
  musculo_id text references musculo(id),
  papel text not null check (papel in ('primario','secundario','estabilizador')),
  primary key (exercicio_id, musculo_id)
);

create table ficha_modelo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references usuario(id),
  nome text not null,
  dia_semana int,  -- 0=dom..6=sab, null=sem dia fixo
  created_at timestamptz default now()
);

create table ficha_modelo_item (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid references ficha_modelo(id),
  exercicio_id uuid references exercicio(id),
  ordem int not null,
  series int default 3,
  reps text default '12',
  descanso_seg int default 90,
  notas text
);

create table sessao_do_dia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references usuario(id),
  ficha_modelo_id uuid references ficha_modelo(id),
  data date not null,
  status text default 'pendente', -- "pendente" | "em_andamento" | "concluida"
  created_at timestamptz default now()
);

create table sessao_item (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid references sessao_do_dia(id),
  exercicio_id uuid references exercicio(id),
  ordem int not null,
  series int,
  reps text,
  carga_kg numeric,
  notas text,
  concluido boolean default false
);

create table preferencia_home (
  user_id uuid primary key references usuario(id),
  blocos jsonb not null default '[]'
);

-- RLS (rascunho)
alter table ficha_modelo enable row level security;
alter table ficha_modelo_item enable row level security;
alter table sessao_do_dia enable row level security;
alter table sessao_item enable row level security;
alter table preferencia_home enable row level security;

-- Política: usuário vê apenas seus dados
-- create policy "user_own" on ficha_modelo for all using (user_id = auth.uid());
-- (aplicar padrão similar em todas as tabelas com user_id)

-- Admin NÃO tem acesso a tabelas pessoais.
-- Admin acessa apenas: exercicio, exercicio_musculo, musculo.
