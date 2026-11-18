<?php
require '/var/www/html/wp-load.php';
$data = json_decode(file_get_contents('/tmp/vsb-legal-content.json'), true, 512, JSON_THROW_ON_ERROR);
$snapshot = ['privacy_page' => get_option('wp_page_for_privacy_policy'), 'documents' => []];
foreach ($data['documents'] as $doc) {
    $existing = get_page_by_path($doc['slug'], OBJECT, 'page');
    $snapshot['documents'][$doc['slug']] = $existing ? ['post' => (array) $existing, 'meta' => get_post_meta($existing->ID)] : null;
}
if (!file_exists('/tmp/vsb-legal-before.json')) {
    file_put_contents('/tmp/vsb-legal-before.json', wp_json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    chmod('/tmp/vsb-legal-before.json', 0600);
}
$result = [];
foreach ($data['documents'] as $doc) {
    $existing = get_page_by_path($doc['slug'], OBJECT, 'page');
    $content = '';
    foreach ($doc['sections'] as $section) {
        $content .= '<h2>' . esc_html($section['title']) . '</h2>' . "\n" . wp_kses_post($section['html']) . "\n";
    }
    $post = [
        'post_type' => 'page', 'post_title' => $doc['title'], 'post_name' => $doc['slug'],
        'post_content' => $content, 'post_status' => 'publish', 'post_author' => 1,
        'comment_status' => 'closed', 'ping_status' => 'closed', 'post_password' => '',
    ];
    if ($existing) { $post['ID'] = $existing->ID; }
    $id = wp_insert_post(wp_slash($post), true);
    if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
    update_post_meta($id, '_vsb_legal_document', $doc['kind']);
    update_post_meta($id, '_vsb_legal_intro', $doc['intro']);
    update_post_meta($id, '_vsb_legal_description', $doc['description']);
    update_post_meta($id, '_vsb_legal_updated', $data['updated']);
    if ($doc['kind'] === 'privacy') { update_option('wp_page_for_privacy_policy', $id); }
    $result[] = ['id' => $id, 'url' => get_permalink($id), 'status' => get_post_status($id)];
}
echo wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
