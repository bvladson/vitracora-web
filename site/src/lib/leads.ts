import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "@/lib/config.server";

/**
 * Registro de leads do formulário de orçamento.
 *
 * A interface só confirma o recebimento quando o CMS retorna um registro.
 * Em caso de falha, mantém os campos e os contatos alternativos disponíveis.
 */

const CMS_URL = import.meta.env.VITE_CMS_URL || "https://cms.vsbseguranca.com.br";

export type LeadInput = {
  nome: string;
  telefone: string;
  servico: string;
  ambiente: string;
  bairro: string;
  descricao: string;
  atribuicao?: string;
};

export type LeadResult = { stored: boolean };

function trim(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalize(input: LeadInput): LeadInput {
  return {
    nome: trim(input.nome, 120),
    telefone: trim(input.telefone, 40),
    servico: trim(input.servico, 80),
    ambiente: trim(input.ambiente, 80),
    bairro: trim(input.bairro, 120),
    descricao: trim(input.descricao, 4000),
    atribuicao: trim(input.atribuicao, 400),
  };
}

export const submitLead = createServerFn({ method: "POST" })
  .validator((data: LeadInput) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Solicitação inválida.");
    }
    return normalize(data);
  })
  .handler(async ({ data }): Promise<LeadResult> => {
    const lead = normalize(data);

    if (!lead.nome || !lead.telefone || !lead.descricao) {
      // Validação de forma, não de conteúdo: o navegador já exige os dois
      // campos, então isso só barra envio direto à função.
      return { stored: false };
    }

    const { leadsToken } = getServerConfig();

    if (!leadsToken) {
      console.warn("[lead] Recebimento de solicitações não configurado.");
      return { stored: false };
    }

    try {
      const response = await fetch(`${CMS_URL}/wp-json/vsb/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-vsb-token": leadsToken,
        },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        console.error(`[lead] CMS respondeu ${response.status}.`);
        return { stored: false };
      }

      const result = (await response.json()) as { id?: unknown };
      return {
        stored: typeof result.id === "number" && Number.isInteger(result.id) && result.id > 0,
      };
    } catch (error) {
      console.error(
        "[lead] Falha ao registrar no CMS:",
        error instanceof Error ? error.name : "Erro de conexão",
      );
      return { stored: false };
    }
  });
