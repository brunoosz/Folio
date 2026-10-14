export interface ArtigoCientifico {
  id: string;
  titulo: string;
  resumo: string;
  fonte: string;
  ano: number;
  tags: string[];
  url?: string;
}

export const artigos: ArtigoCientifico[] = [
  {
    id: 'art01',
    titulo: 'Agachamento livre vs. Leg Press: diferenças na ativação muscular',
    resumo: 'O agachamento livre demonstrou maior ativação dos eretores da espinha e estabilizadores do tronco comparado ao leg press, que isola predominantemente quadríceps com menor demanda de controle motor.',
    fonte: 'Escamilla RF et al. Medicine & Science in Sports & Exercise',
    ano: 2001,
    tags: ['quadríceps', 'agachamento', 'leg press', 'ativação muscular'],
  },
  {
    id: 'art02',
    titulo: 'Efeito do ângulo de inclinação no supino sobre a ativação do peitoral',
    resumo: 'A inclinação de 30° a 45° no supino aumenta significativamente a ativação da porção clavicular do peitoral maior, enquanto o supino reto enfatiza a porção esternal.',
    fonte: 'Trebs AA et al. Journal of Strength and Conditioning Research',
    ano: 2010,
    tags: ['peitoral', 'supino', 'inclinação'],
  },
  {
    id: 'art03',
    titulo: 'Creatina monohidratada: eficácia e segurança',
    resumo: 'A suplementação de creatina monohidratada (3-5g/dia) demonstrou aumentar a força e a massa muscular em exercícios de alta intensidade. É um dos suplementos mais estudados e considerado seguro para uso prolongado.',
    fonte: 'Kreider RB et al. Journal of the International Society of Sports Nutrition',
    ano: 2017,
    tags: ['creatina', 'suplementação', 'força'],
  },
  {
    id: 'art04',
    titulo: 'Sono e recuperação muscular: impacto na síntese proteica',
    resumo: 'A privação de sono reduz a síntese proteica muscular e aumenta o catabolismo. Recomenda-se 7-9 horas de sono para otimizar a recuperação após exercícios de resistência.',
    fonte: 'Dattilo M et al. Medical Hypotheses',
    ano: 2011,
    tags: ['sono', 'recuperação', 'síntese proteica'],
  },
  {
    id: 'art05',
    titulo: 'Proteção articular: exercícios com menor estresse lombar',
    resumo: 'Exercícios em máquinas guiadas (leg press, hack squat) reduzem a compressão axial da coluna em comparação com agachamentos livres, sendo alternativas para indivíduos com histórico de lesão lombar.',
    fonte: 'Comfort P et al. Journal of Strength and Conditioning Research',
    ano: 2014,
    tags: ['lombar', 'proteção articular', 'máquinas'],
  },
  {
    id: 'art06',
    titulo: 'Hidratação e desempenho no exercício',
    resumo: 'Uma desidratação de apenas 2% do peso corporal pode reduzir o desempenho em exercícios de força em até 10%. A ingestão fracionada de água ao longo do dia é mais eficaz que grandes volumes esporádicos.',
    fonte: 'Judelson DA et al. Sports Medicine',
    ano: 2007,
    tags: ['hidratação', 'desempenho', 'água'],
  },
  {
    id: 'art07',
    titulo: 'Volume de treino e hipertrofia: dose-resposta',
    resumo: 'Meta-análise indica que 10+ séries semanais por grupo muscular são necessárias para maximizar hipertrofia em praticantes treinados. Volumes menores são suficientes para iniciantes.',
    fonte: 'Schoenfeld BJ et al. Journal of Sports Sciences',
    ano: 2017,
    tags: ['volume', 'hipertrofia', 'séries'],
  },
  {
    id: 'art08',
    titulo: 'Stiff e ativação dos isquiotibiais: riscos e benefícios',
    resumo: 'O stiff é altamente eficaz na ativação dos isquiotibiais e glúteos, mas exige rigorosa manutenção da coluna neutra. Não é recomendado para iniciantes sem supervisão profissional.',
    fonte: 'McAllister MJ et al. Journal of Strength and Conditioning Research',
    ano: 2014,
    tags: ['stiff', 'isquiotibiais', 'segurança'],
  },
  {
    id: 'art09',
    titulo: 'Suplementação de proteína e ganhos de massa e força',
    resumo: 'Meta-análise com 49 ensaios mostrou que a suplementação proteica potencializa modestamente os ganhos de força e massa magra com treino resistido. O benefício tende a se estabilizar por volta de 1,6 g/kg/dia de proteína total, com variação individual.',
    fonte: 'Morton RW et al. British Journal of Sports Medicine',
    ano: 2018,
    tags: ['proteína', 'whey', 'suplementação', 'hipertrofia', 'massa', 'dieta', 'nutrição'],
  },
  {
    id: 'art10',
    titulo: 'Frequência de treino e hipertrofia',
    resumo: 'Treinar cada grupo muscular ao menos duas vezes por semana resultou em hipertrofia superior a uma vez por semana, quando o volume não era igualado. A distribuição do volume ao longo da semana parece ser o fator relevante.',
    fonte: 'Schoenfeld BJ, Ogborn D, Krieger JW. Sports Medicine',
    ano: 2016,
    tags: ['frequência', 'hipertrofia', 'divisão', 'semana', 'treino'],
  },
  {
    id: 'art11',
    titulo: 'Cargas baixas vs. altas: força e hipertrofia',
    resumo: 'Revisão sistemática indicou hipertrofia semelhante com cargas baixas e altas quando as séries são levadas próximas da falha, enquanto cargas altas favorecem ganhos de força máxima.',
    fonte: 'Schoenfeld BJ et al. Journal of Strength and Conditioning Research',
    ano: 2017,
    tags: ['carga', 'repetições', 'força', 'hipertrofia', 'peso', 'falha'],
  },
  {
    id: 'art12',
    titulo: 'Intervalo de descanso entre séries',
    resumo: 'Em homens treinados, intervalos de 3 minutos entre séries produziram maiores ganhos de força e hipertrofia do que intervalos de 1 minuto, com volume de treino semelhante planejado.',
    fonte: 'Schoenfeld BJ et al. Journal of Strength and Conditioning Research',
    ano: 2016,
    tags: ['descanso', 'intervalo', 'séries', 'hipertrofia', 'força', 'pausa'],
  },
  {
    id: 'art13',
    titulo: 'Cafeína e desempenho no exercício',
    resumo: 'Posicionamento da ISSN: a cafeína melhora de forma consistente vários aspectos do desempenho. Na literatura, doses de 3 a 6 mg/kg cerca de 60 minutos antes do exercício são as mais estudadas; a tolerância e efeitos adversos variam entre pessoas.',
    fonte: 'Guest NS et al. Journal of the International Society of Sports Nutrition',
    ano: 2021,
    tags: ['cafeína', 'café', 'pré-treino', 'suplementação', 'desempenho', 'energia'],
  },
  {
    id: 'art14',
    titulo: 'Alongamento antes do exercício: efeitos agudos',
    resumo: 'Alongamento estático prolongado (mais de 60 s por músculo) pode reduzir levemente a força e a potência logo em seguida; durações curtas dentro de um aquecimento completo têm efeito pequeno. Alongar aumenta a amplitude de movimento de forma aguda.',
    fonte: 'Behm DG et al. Applied Physiology, Nutrition, and Metabolism',
    ano: 2016,
    tags: ['alongamento', 'aquecimento', 'flexibilidade', 'mobilidade', 'amplitude'],
  },
  {
    id: 'art15',
    titulo: 'Quantidade de sono recomendada para adultos',
    resumo: 'Consenso da American Academy of Sleep Medicine e da Sleep Research Society: adultos devem dormir regularmente 7 horas ou mais por noite para promover saúde ideal. Dormir menos está associado a piores desfechos de saúde e desempenho.',
    fonte: 'Watson NF et al. Sleep',
    ano: 2015,
    tags: ['sono', 'dormir', 'descanso', 'recuperação', 'horas'],
  },
  {
    id: 'art16',
    titulo: 'Diretrizes da OMS para atividade física',
    resumo: 'Adultos devem acumular 150 a 300 minutos semanais de atividade aeróbica moderada (ou 75 a 150 minutos vigorosa) e fazer fortalecimento muscular em 2 ou mais dias por semana. Reduzir o tempo sentado traz benefícios.',
    fonte: 'Bull FC et al. British Journal of Sports Medicine',
    ano: 2020,
    tags: ['atividade física', 'aeróbico', 'cardio', 'caminhada', 'saúde', 'sedentarismo', 'semana'],
  },
];

export const respostasIA: { pergunta: string; resposta: string; artigos: string[] }[] = [
  {
    pergunta: 'Posso trocar agachamento por leg press?',
    resposta: 'São exercícios diferentes com demandas biomecânicas distintas. O agachamento livre recruta estabilizadores da coluna e exige controle motor que o leg press elimina. O leg press pode ser uma alternativa para quem tem restrições lombares, mas não substitui completamente o agachamento em termos de estímulo funcional. Consulte seu profissional de Educação Física.',
    artigos: ['art01', 'art05'],
  },
  {
    pergunta: 'Quanto de água devo tomar por dia?',
    resposta: 'A recomendação geral é 35ml por kg de peso corporal, distribuídos ao longo do dia. Durante o treino, a hidratação é especialmente importante: desidratação de 2% já impacta o desempenho. Prefira ingestão fracionada a grandes volumes de uma vez.',
    artigos: ['art06'],
  },
  {
    pergunta: 'Creatina é segura?',
    resposta: 'A creatina monohidratada é um dos suplementos mais estudados e considerada segura para uso prolongado na dose de 3-5g/dia. Os benefícios incluem aumento de força e massa muscular. Sempre consulte um nutricionista antes de iniciar qualquer suplementação.',
    artigos: ['art03'],
  },
  {
    pergunta: 'Quanto devo dormir para ganhar massa?',
    resposta: 'A recomendação é de 7-9 horas por noite. A privação de sono compromete a síntese proteica muscular e aumenta o catabolismo, prejudicando diretamente os resultados do treino de hipertrofia.',
    artigos: ['art04'],
  },
  {
    pergunta: 'Quantas séries por semana são ideais?',
    resposta: 'Para praticantes treinados, meta-análises indicam que 10+ séries semanais por grupo muscular otimizam a hipertrofia. Iniciantes se beneficiam de volumes menores. O progresso deve ser gradual e acompanhado por profissional.',
    artigos: ['art07'],
  },
  {
    pergunta: 'Stiff é perigoso?',
    resposta: 'O stiff é excelente para isquiotibiais e glúteos, mas exige técnica rigorosa de coluna neutra. Não é recomendado para iniciantes sem supervisão. Se você tem histórico de lesão lombar, considere a mesa flexora como alternativa mais segura.',
    artigos: ['art08', 'art05'],
  },
  {
    pergunta: 'Quanta proteína preciso por dia?',
    resposta: 'Em pessoas que treinam força, uma meta-análise observou que o benefício da proteína para massa magra tende a se estabilizar perto de 1,6 g por kg de peso por dia (somando alimentação e suplementos), com variação individual. A quantidade ideal para você depende de rotina, saúde e objetivos — um nutricionista pode ajustar isso com segurança.',
    artigos: ['art09'],
  },
  {
    pergunta: 'Quanto tempo descansar entre as séries?',
    resposta: 'Em homens treinados, intervalos de cerca de 3 minutos renderam mais força e hipertrofia do que 1 minuto, provavelmente por permitir manter a carga e as repetições. Para exercícios menores, intervalos mais curtos costumam funcionar. Ajuste com seu profissional de Educação Física.',
    artigos: ['art12'],
  },
  {
    pergunta: 'Devo alongar antes de treinar?',
    resposta: 'Alongamentos estáticos longos (mais de 60 s por músculo) logo antes do treino podem reduzir um pouco a força e a potência. Alongamentos curtos dentro de um aquecimento completo, com movimentos dinâmicos e séries leves, têm efeito pequeno e ajudam na amplitude.',
    artigos: ['art14'],
  },
];
