/**
 * Emite um bloco JSON-LD. Fica em arquivo próprio para que
 * src/lib/structured-data.ts exporte apenas funções — misturar componente e
 * utilitários no mesmo módulo quebra o fast refresh no dev.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify já escapa aspas; o escape adicional de "<" fecha a
      // possibilidade de um título vindo do CMS encerrar a tag <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
