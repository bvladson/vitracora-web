import type { CatalogProductCard, ProductCategory } from "./cms";
import type { CatalogKind } from "./catalog-search";

// Raízes existentes no WooCommerce. Uma categoria nova e desconhecida permanece
// no catálogo geral até sua classificação, sem adivinhar pelo nome do item.
const EQUIPMENT_ROOTS = new Set([
  "cftv",
  "alarmes",
  "cerca-eletrica",
  "automacao-de-portoes",
  "controle-de-acesso",
  "interfonia",
  "redes-e-infraestrutura",
  "fontes-e-energia",
  "seguranca-perimetral",
]);

export function categoryPath(category: ProductCategory, categories: ProductCategory[]) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const path: ProductCategory[] = [];
  const visited = new Set<number>();
  let current: ProductCategory | undefined = category;
  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    current = byId.get(current.parent);
  }
  return path;
}

export function categoryKind(
  category: ProductCategory,
  categories: ProductCategory[],
): CatalogKind {
  const root = categoryPath(category, categories)[0];
  if (root?.parent !== 0) return "all";
  if (root.slug === "servicos-vsb") return "servicos";
  return EQUIPMENT_ROOTS.has(root.slug) ? "equipamentos" : "all";
}

export function kindLabel(kind: CatalogKind) {
  return kind === "servicos" ? "Serviços" : kind === "equipamentos" ? "Equipamentos" : "Catálogo";
}

export function categoryLabel(category: ProductCategory, categories: ProductCategory[]) {
  const path = categoryPath(category, categories);
  const kind = categoryKind(category, categories);
  const names = path.filter((item) => item.slug !== "servicos-vsb").map((item) => item.name);
  return [kindLabel(kind), ...names].join(" › ");
}

export function catalogRoots(categories: ProductCategory[], kind: CatalogKind) {
  return categories.filter(
    (category) => category.parent === 0 && categoryKind(category, categories) === kind,
  );
}

export function productCatalogInfo(product: CatalogProductCard, categories: ProductCategory[]) {
  const paths = product.categories
    .map((item) => categories.find((category) => category.id === item.id))
    .filter((item): item is ProductCategory => Boolean(item))
    .map((item) => categoryPath(item, categories))
    .sort((a, b) => b.length - a.length);
  const selected = paths[0]?.at(-1);
  const kind = selected ? categoryKind(selected, categories) : "all";
  return {
    kind,
    label:
      kind === "servicos"
        ? "Serviço"
        : kind === "equipamentos"
          ? "Equipamento"
          : "Item do catálogo",
    category: selected,
    categoryLabel: selected
      ? categoryLabel(selected, categories)
      : product.categories.map((category) => category.name).join(" › "),
  };
}

export function categoryGroups(categories: ProductCategory[], kind: CatalogKind) {
  const groups = new Map<string, Array<ProductCategory & { optionLabel: string }>>();
  for (const category of categories) {
    if (category.count === 0) continue;
    const itemKind = categoryKind(category, categories);
    if (kind !== "all" && kind !== itemKind) continue;
    const path = categoryPath(category, categories).filter((item) => item.slug !== "servicos-vsb");
    const group = [kindLabel(itemKind), path[0]?.name].filter(Boolean).join(" · ");
    // O caminho completo continua visível quando o select está fechado;
    // nomes como "Fontes" e "Manutenção" existem em áreas diferentes.
    const optionLabel = categoryLabel(category, categories);
    const entries = groups.get(group) || [];
    entries.push({ ...category, optionLabel });
    groups.set(group, entries);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([label, options]) => ({
      label,
      options: options.sort((a, b) => {
        const aRoot =
          categoryPath(a, categories).filter((item) => item.slug !== "servicos-vsb").length <= 1;
        const bRoot =
          categoryPath(b, categories).filter((item) => item.slug !== "servicos-vsb").length <= 1;
        return Number(bRoot) - Number(aRoot) || a.optionLabel.localeCompare(b.optionLabel, "pt-BR");
      }),
    }));
}
