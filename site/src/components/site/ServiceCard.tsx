import { Link } from "@tanstack/react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

/**
 * A prop `accent` existia para pintar o ícone de verde, ciano ou âmbar.
 * Era cor decorativa: o rótulo do card já diz do que se trata, então a cor
 * não carregava informação nenhuma. E as três viviam na mesma luminosidade,
 * de modo que verde e âmbar ficavam a ΔE 9 sob deuteranopia — quase
 * indistinguíveis para quem tem daltonismo vermelho-verde.
 *
 * Agora o ícone é sempre o acento único e a distinção entre serviços vem do
 * desenho do ícone e do texto. A prop segue aceita para não quebrar as 27
 * chamadas existentes, mas não altera mais a aparência.
 */
export function ServiceCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  to?: string;
  accent?: "primary" | "cyan" | "amber";
}) {
  const content = (
    <div className="card-tech group h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-primary transition-colors group-hover:border-primary/50">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        {to && (
          <ArrowUpRight
            className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden="true"
          />
        )}
      </div>
      <h3 className="mt-4 text-base text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}
