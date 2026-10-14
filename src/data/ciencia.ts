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
];
