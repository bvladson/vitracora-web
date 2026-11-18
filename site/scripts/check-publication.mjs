const required = [
  "VITE_SITE_URL",
  "VITE_PHONE_DISPLAY",
  "VITE_PHONE_NUMBER",
  "VITE_WHATSAPP_NUMBER",
  "VITE_CONTACT_EMAIL",
];

const missing = required.filter((name) => {
  const value = process.env[name]?.trim();
  return (
    !value || value.includes("seudominio") || value.includes("XXXX") || value === "5585999999999"
  );
});

if (missing.length > 0) {
  console.error("Publicacao bloqueada. Configure dados reais em .env:");
  for (const name of missing) console.error(`- ${name}`);
  process.exit(1);
}

console.log("Dados publicos configurados. Executando validacoes...");
