<?php
/**
 * Plugin Name: VSB — Páginas legais
 * Description: Apresentação mínima e pública das páginas de termos e privacidade.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) { exit; }

// Legal documents must remain public while the WooCommerce store is coming soon.
add_filter('woocommerce_coming_soon_exclude', static function ($exclude) {
    if (!is_page()) { return $exclude; }
    $kind = get_post_meta(get_queried_object_id(), '_vsb_legal_document', true);
    return in_array($kind, ['terms', 'privacy'], true) ? true : $exclude;
});

add_filter('template_include', static function ($template) {
    if (!is_page()) { return $template; }
    $kind = get_post_meta(get_queried_object_id(), '_vsb_legal_document', true);
    if (in_array($kind, ['terms', 'privacy'], true)) {
        return __DIR__ . '/vsb-legal-pages/template.php';
    }
    return $template;
}, 99);
