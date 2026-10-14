/**
 * Extrai o texto de um PDF no próprio aparelho (nada é enviado).
 * O pdf.js só é carregado quando necessário (import dinâmico).
 * Usa a build "legacy" para funcionar também em WebViews Android mais antigas.
 */
export async function extrairTextoPdf(arquivo: File, onProgresso?: (pagina: number, total: number) => void, maxPaginas = 400): Promise<string> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const dados = new Uint8Array(await arquivo.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: dados }).promise;
  const total = Math.min(doc.numPages, maxPaginas);
  const paginas: string[] = [];
  for (let p = 1; p <= total; p++) {
    const pagina = await doc.getPage(p);
    const conteudo = await pagina.getTextContent();
    // Reagrupa os trechos em linhas pela posição vertical.
    const linhas = new Map<number, { x: number; s: string }[]>();
    for (const it of conteudo.items) {
      if (!('str' in it) || !it.str.trim()) continue;
      const y = Math.round(it.transform[5] / 3) * 3;
      const l = linhas.get(y) ?? [];
      l.push({ x: it.transform[4], s: it.str });
      linhas.set(y, l);
    }
    const texto = [...linhas.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, l]) => l.sort((a, b) => a.x - b.x).map(t => t.s).join('  ').replace(/\s{3,}/g, '  ').trim())
      .join('\n');
    paginas.push(texto);
    onProgresso?.(p, total);
    pagina.cleanup();
  }
  await doc.destroy();
  return paginas.join('\n\n');
}
