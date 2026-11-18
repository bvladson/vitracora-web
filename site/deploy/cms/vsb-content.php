<?php
/**
 * Plugin Name: VSB Conteúdo Headless
 * Description: Tipos de conteúdo usados pelo site institucional VSB.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

function vsb_register_content_type(string $type, string $single, string $plural, string $slug): void
{
    register_post_type($type, [
        'labels' => [
            'name' => $plural,
            'singular_name' => $single,
            'add_new_item' => "Adicionar {$single}",
            'edit_item' => "Editar {$single}",
            'search_items' => "Buscar em {$plural}",
        ],
        'public' => true,
        'show_in_rest' => true,
        'menu_position' => 20,
        'menu_icon' => match ($type) {
            'vsb_service' => 'dashicons-admin-tools',
            'vsb_portfolio' => 'dashicons-format-gallery',
            'vsb_client' => 'dashicons-groups',
            default => 'dashicons-admin-post',
        },
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields'],
        'has_archive' => true,
        'rewrite' => ['slug' => $slug],
        'rest_base' => $slug,
    ]);
}

add_action('init', function (): void {
    vsb_register_content_type('vsb_service', 'Serviço', 'Serviços', 'servicos-cms');
    // O último argumento é o rest_base — precisa continuar sem acento,
    // é a URL que src/lib/cms.ts consome.
    vsb_register_content_type('vsb_portfolio', 'Projeto', 'Portfólio', 'portfolio-cms');
    vsb_register_content_type('vsb_client', 'Cliente', 'Clientes', 'clientes-cms');

    // Leads do formulário de orçamento. Privado: aparece só no painel,
    // nunca na API pública nem no site.
    register_post_type('vsb_lead', [
        'labels' => [
            'name' => 'Leads',
            'singular_name' => 'Lead',
            'search_items' => 'Buscar leads',
            'not_found' => 'Nenhum lead recebido ainda.',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => false,
        'menu_position' => 3,
        'menu_icon' => 'dashicons-email-alt',
        'supports' => ['title', 'editor', 'custom-fields'],
        'capability_type' => 'post',
        'capabilities' => ['create_posts' => 'do_not_allow'],
        'map_meta_cap' => true,
    ]);
});

add_action('rest_api_init', function (): void {
    register_rest_field(['vsb_service', 'vsb_portfolio', 'vsb_client'], 'featured_image', [
        'get_callback' => function (array $post): ?array {
            $image_id = get_post_thumbnail_id($post['id']);
            if (!$image_id) {
                return null;
            }

            return [
                'url' => wp_get_attachment_image_url($image_id, 'large'),
                'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
            ];
        },
        'schema' => [
            'description' => 'Imagem destacada pronta para consumo pelo frontend.',
            'type' => ['object', 'null'],
            'context' => ['view', 'edit'],
        ],
    ]);
});

add_filter('rest_prepare_product', function ($response) {
    $response->data['catalog_only'] = true;
    return $response;
});

/* -------------------------------------------------------------------------
 * Recebimento de leads
 *
 * O formulário de orçamento do site grava o lead aqui ANTES de abrir o
 * WhatsApp. Sem isso, todo contato que não completasse a transição para o
 * WhatsApp se perdia sem deixar registro.
 *
 * Autenticação por segredo compartilhado (VSB_LEADS_TOKEN), comparado em
 * tempo constante. O endpoint só aceita POST e nunca expõe leitura.
 * ---------------------------------------------------------------------- */

function vsb_leads_token(): string
{
    $token = getenv('VSB_LEADS_TOKEN');
    return is_string($token) ? trim($token) : '';
}

function vsb_clean_field($value, int $max = 500): string
{
    if (!is_scalar($value)) {
        return '';
    }
    return mb_substr(sanitize_text_field((string) $value), 0, $max);
}

add_action('rest_api_init', function (): void {
    register_rest_route('vsb/v1', '/leads', [
        'methods' => 'POST',
        'permission_callback' => function (WP_REST_Request $request) {
            $expected = vsb_leads_token();
            if ($expected === '') {
                return new WP_Error('vsb_leads_disabled', 'Recebimento de leads não configurado.', ['status' => 503]);
            }
            $provided = (string) $request->get_header('x-vsb-token');
            if (!hash_equals($expected, $provided)) {
                return new WP_Error('vsb_leads_forbidden', 'Token inválido.', ['status' => 403]);
            }
            return true;
        },
        'callback' => function (WP_REST_Request $request) {
            $body = $request->get_json_params() ?: [];

            $name = vsb_clean_field($body['nome'] ?? '', 120);
            $phone = vsb_clean_field($body['telefone'] ?? '', 40);
            $service = vsb_clean_field($body['servico'] ?? '', 80);
            $environment = vsb_clean_field($body['ambiente'] ?? '', 80);
            $district = vsb_clean_field($body['bairro'] ?? '', 120);
            $attribution = vsb_clean_field($body['atribuicao'] ?? '', 400);
            $description = mb_substr(
                sanitize_textarea_field((string) ($body['descricao'] ?? '')),
                0,
                4000
            );

            if ($name === '' || $phone === '') {
                return new WP_Error('vsb_leads_invalid', 'Nome e telefone são obrigatórios.', ['status' => 422]);
            }

            $title = sprintf(
                '%s — %s%s',
                $name,
                $service !== '' ? $service : 'Sem serviço informado',
                $district !== '' ? " ({$district})" : ''
            );

            $post_id = wp_insert_post([
                'post_type' => 'vsb_lead',
                'post_status' => 'private',
                'post_title' => $title,
                'post_content' => $description,
                'meta_input' => [
                    'vsb_nome' => $name,
                    'vsb_telefone' => $phone,
                    'vsb_servico' => $service,
                    'vsb_ambiente' => $environment,
                    'vsb_bairro' => $district,
                    'vsb_atribuicao' => $attribution,
                    'vsb_recebido_em' => current_time('mysql'),
                ],
            ], true);

            if (is_wp_error($post_id)) {
                return new WP_Error('vsb_leads_failed', 'Não foi possível gravar o lead.', ['status' => 500]);
            }

            return new WP_REST_Response(['id' => $post_id], 201);
        },
    ]);
});

// Colunas úteis na listagem de leads do painel.
add_filter('manage_vsb_lead_posts_columns', function (array $columns): array {
    return [
        'cb' => $columns['cb'] ?? '',
        'title' => 'Lead',
        'vsb_telefone' => 'Telefone',
        'vsb_ambiente' => 'Ambiente',
        'vsb_atribuicao' => 'Origem',
        'date' => 'Recebido',
    ];
});

add_action('manage_vsb_lead_posts_custom_column', function (string $column, int $post_id): void {
    if (str_starts_with($column, 'vsb_')) {
        echo esc_html((string) get_post_meta($post_id, $column, true));
    }
}, 10, 2);

/* -------------------------------------------------------------------------
 * Blindagem do modo headless
 * ---------------------------------------------------------------------- */

// A versão do WordPress não precisa ser anunciada no HTML e nos feeds.
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

// Enumeração de usuários: bloqueada também no nível da aplicação, para o
// caso de o site ser servido sem passar pelo nginx do deploy.
add_filter('rest_endpoints', function (array $endpoints): array {
    unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    return $endpoints;
});

add_action('template_redirect', function (): void {
    if (!is_admin() && isset($_GET['author'])) {
        wp_safe_redirect(home_url(), 301);
        exit;
    }
});

// XML-RPC não é usado no modo headless.
add_filter('xmlrpc_enabled', '__return_false');
