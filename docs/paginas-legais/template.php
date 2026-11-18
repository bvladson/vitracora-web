<?php
if (!defined('ABSPATH')) { exit; }
$page_id = get_queried_object_id();
$page = get_post($page_id);
$kind = get_post_meta($page_id, '_vsb_legal_document', true);
$intro = get_post_meta($page_id, '_vsb_legal_intro', true);
$description = get_post_meta($page_id, '_vsb_legal_description', true);
$updated = get_post_meta($page_id, '_vsb_legal_updated', true);
$assets = content_url('/uploads/vsb-legal-assets/');
$terms = home_url('/termos-de-servico/');
$privacy = home_url('/politica-de-privacidade/');
?><!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo esc_html(get_the_title($page_id)); ?> | VSB Soluções técnicas</title>
  <meta name="description" content="<?php echo esc_attr($description); ?>">
  <meta name="robots" content="index,follow">
  <meta name="theme-color" content="#123B4A">
  <link rel="canonical" href="<?php echo esc_url(get_permalink($page_id)); ?>">
  <link rel="icon" type="image/png" sizes="32x32" href="<?php echo esc_url($assets . 'favicon-oficial-32.png'); ?>">
  <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo esc_url($assets . 'manrope-latin-variable.woff2'); ?>">
  <link rel="stylesheet" href="<?php echo esc_url($assets . 'legal-v1.css'); ?>">
</head>
<body>
  <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
  <header class="legal-header">
    <a href="https://vsbseguranca.com.br/" aria-label="VSB Soluções técnicas — início"><img src="<?php echo esc_url($assets . 'logo-principal-oficial-20260911.png'); ?>" alt="VSB Soluções técnicas" width="2560" height="736"></a>
    <a class="back-link" href="https://vsbseguranca.com.br/">Voltar ao site <span aria-hidden="true">↗</span></a>
  </header>
  <main id="conteudo" class="legal-main">
    <p class="eyebrow">Informações legais</p>
    <h1><?php echo esc_html(get_the_title($page_id)); ?></h1>
    <p class="intro"><?php echo esc_html($intro); ?></p>
    <p class="updated">Última atualização: <time datetime="<?php echo esc_attr($updated); ?>"><?php echo esc_html(wp_date('d/m/Y', strtotime($updated . ' 12:00:00'))); ?></time></p>
    <nav class="legal-nav" aria-label="Documentos legais">
      <a href="<?php echo esc_url($terms); ?>" <?php if ($kind === 'terms') { echo 'aria-current="page"'; } ?>>Termos de Serviço</a>
      <a href="<?php echo esc_url($privacy); ?>" <?php if ($kind === 'privacy') { echo 'aria-current="page"'; } ?>>Política de Privacidade</a>
    </nav>
    <article class="legal-content" aria-label="<?php echo esc_attr(get_the_title($page_id)); ?>">
      <?php echo wp_kses_post(wpautop($page->post_content)); ?>
    </article>
    <aside class="legal-contact">
      <h2>Fale com a VSB</h2>
      <p>Dúvidas sobre estes documentos ou sobre seus dados?</p>
      <a href="mailto:contato@vsbseguranca.com.br">contato@vsbseguranca.com.br</a>
      <a href="tel:+5585986293430">(85) 98629-3430</a>
    </aside>
  </main>
  <footer class="legal-footer"><span>© <?php echo esc_html(wp_date('Y')); ?> VSB Soluções técnicas</span><span>Fortaleza — Ceará</span><a href="https://vsbseguranca.com.br/">Site principal</a></footer>
</body>
</html>
