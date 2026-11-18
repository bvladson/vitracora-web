/** Parâmetros de busca do catálogo, tal como aparecem na URL. */
export type CatalogKind = "all" | "equipamentos" | "servicos";
export type ProductSearch = { page?: number; q?: string; cat?: string; tipo?: CatalogKind };

export function catalogKind(value: unknown): CatalogKind {
  return value === "equipamentos" || value === "servicos" ? value : "all";
}

/**
 * Só o que difere do padrão entra na URL.
 *
 * Se `validateSearch` devolvesse sempre `page: 1`, o roteador consideraria a
 * URL fora da forma canônica e responderia /produtos com um 307 para
 * /produtos?page=1&q=&cat=all em toda visita.
 */
export function catalogSearch(next: ProductSearch): ProductSearch {
  const search: ProductSearch = {};
  if (next.page && Number.isSafeInteger(Math.trunc(next.page)) && Math.trunc(next.page) > 1) {
    search.page = Math.trunc(next.page);
  }
  if (next.q?.trim()) search.q = next.q.trim().slice(0, 100);
  if (next.cat && next.cat !== "all") search.cat = next.cat;
  const kind = catalogKind(next.tipo);
  if (kind !== "all") search.tipo = kind;
  return search;
}

export function catalogPath(search: ProductSearch): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(catalogSearch(search))) {
    params.set(key, String(value));
  }
  return `/produtos${params.size ? `?${params.toString()}` : ""}`;
}
