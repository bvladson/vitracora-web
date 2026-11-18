import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/termos-de-servico")({
  beforeLoad: () => {
    throw redirect({
      href: "https://cms.vsbseguranca.com.br/termos-de-servico/",
      statusCode: 301,
    });
  },
});
