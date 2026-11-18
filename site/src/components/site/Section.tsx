import type { ReactNode } from "react";

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`site-section relative py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/**
 * Rótulo de seção. Era um chip com borda em toda seção do site; como
 * aparece dezenas de vezes, virava um retângulo repetido acima de cada
 * título. Agora é só texto: maiúsculas, entrelinha aberta, na cor de
 * acento — mesma função, um objeto a menos na página.
 */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
      <h2 className="mt-4 text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  // Sem grade técnica nem halo verde no topo. O cabeçalho de página se
  // apoia na própria tipografia e numa linha de base.
  return (
    <section className="relative border-b border-border">
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h1 className="mt-5 text-4xl text-foreground sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
