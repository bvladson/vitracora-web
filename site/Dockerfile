FROM oven/bun:1.2.22-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_SITE_URL
ARG VITE_PHONE_DISPLAY
ARG VITE_PHONE_NUMBER
ARG VITE_WHATSAPP_NUMBER
ARG VITE_CONTACT_EMAIL
ARG VITE_CMS_URL
ARG VITE_GTM_ID
ARG VITE_GA_MEASUREMENT_ID

ENV VITE_SITE_URL=$VITE_SITE_URL \
    VITE_PHONE_DISPLAY=$VITE_PHONE_DISPLAY \
    VITE_PHONE_NUMBER=$VITE_PHONE_NUMBER \
    VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL \
    VITE_CMS_URL=$VITE_CMS_URL \
    VITE_GTM_ID=$VITE_GTM_ID \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID

RUN bun run test:youtube && bun run check:publish

FROM oven/bun:1.2.22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# VSB_LEADS_TOKEN é lido em tempo de requisição (não de build) por
# src/lib/config.server.ts. Passe no run:
#   docker run -e VSB_LEADS_TOKEN=... vsb-site
# Sem ele o formulário informa que a solicitação não foi registrada.

COPY --from=build /app/.output ./.output

EXPOSE 3000
USER bun
CMD ["bun", ".output/server/index.mjs"]
