# Roadmap — Folio

## Concluído
1. ~~Fase 0: Fundação (tokens, componentes, splash, rotas, PWA)~~
2. ~~Fase 1: Home personalizável + Treino com drag-and-drop~~
3. ~~Fase 2: Troca de exercício + Mapa muscular 2D~~
4. ~~Fase 3: Rotina diária completa (hábitos, hidratação, sono)~~
5. ~~Fase 4: Assistente IA (mock) + Biblioteca científica + Painel admin~~
6. ~~Fase 5: Histórico de progressão e gráficos~~
7. ~~Fase 6: Acabamento profissional, IA Groq, builds .exe/.apk~~
   - Animação de abertura, animações em todas as telas (com `prefers-reduced-motion`)
   - Assistente com Groq configurável pela dona/pelo dono em Configurações
   - Ícones completos (PWA, Windows, Android adaptativo) e splash
   - CI: instalador Windows (NSIS) + APK Android publicados no GitHub Releases

8. ~~Fase 7: Base de conhecimento do usuário e treino inteligente (v1.0.1)~~
   - Pesquisa inicial, perfil físico e consentimento LGPD
   - Treino compacto + ficha do exercício com boneco animado, vídeo e progressão 12/10/8
   - Fichas (manual, modelos prontos, IA), modos "Apenas hoje"/"Salvar como padrão"
   - Mapa muscular com sub-regiões e catálogo de ~70 exercícios
   - Rotina: água por garrafa, registro de sono, minha rotina com horários
   - Nutrição: plano da nutricionista, conversa com IA e trocas offline
   - Troca com proteção articular e sugestão da IA; editor do catálogo no admin
   - Tema escuro, exportação de dados e fontes embutidas

9. ~~Fase 8: Saúde completa e IA com materiais próprios (v1.0.2)~~
   - Nutrição: prato ilustrado por refeição, diário do que foi comido e comparação com o plano (local + IA)
   - Exames de sangue, urina, fezes e imagem: leitura de laudo (texto/PDF), faixas de referência, evolução e leitura da IA
   - Remédios com horários e marcação de doses na Rotina; Rotina personalizável
   - Base de conhecimento do dono (artigos, livros, apostilas, vídeos, anotações) com RAG e citações
   - Lembretes de água, sono, remédios e treino (Android nativo; PC na bandeja)

## Próximas fases
10. Fase 9: Supabase real + autenticação + RLS (substitui o armazenamento local)
11. Fase 10: Chave da Groq em Edge Function do Supabase (sai do dispositivo)
12. Fase 11: Embeddings (pgvector) para a base de conhecimento e OCR de laudos escaneados
13. Fase 12: Mapa muscular 3D
14. Fase 13: Gamificação
15. Fase 14: APK assinado (release) e instalador Windows com assinatura de código
