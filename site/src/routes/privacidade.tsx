import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  beforeLoad: () => {
    throw redirect({
      href: "https://cms.vsbseguranca.com.br/politica-de-privacidade/",
      statusCode: 301,
    });
  },
});
