export type BlogPost = {
  slug: string;
  tag: string;
  title: string;
  date: string;
  isoDate: string;
  excerpt: string;
  introduction: string;
  html?: string;
  service?: string;
  sections: Array<{ title: string; paragraphs: string[]; items?: string[] }>;
};

const LEGACY_BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-escolher-cameras-cftv",
    tag: "Câmeras",
    title: "Como escolher câmeras CFTV para sua casa",
    date: "10 Jun 2026",
    isoDate: "2026-06-10",
    excerpt:
      "Resolução, ângulo, visão noturna e infraestrutura: o que realmente importa na hora de comprar.",
    introduction:
      "Uma boa câmera é apenas uma parte do sistema. Posição, iluminação, gravação e alimentação elétrica determinam se a imagem será útil quando você precisar dela.",
    sections: [
      {
        title: "Comece pelo objetivo de cada ponto",
        paragraphs: [
          "Antes de escolher o equipamento, defina o que cada câmera precisa mostrar. Reconhecer um rosto no portão exige uma posição diferente de acompanhar a movimentação geral de um quintal.",
        ],
        items: [
          "Entrada principal: priorize identificação facial.",
          "Garagem e corredor: priorize cobertura sem pontos cegos.",
          "Área externa: use equipamento adequado para chuva e poeira.",
        ],
      },
      {
        title: "Resolução não resolve tudo",
        paragraphs: [
          "Mais megapixels ajudam, mas uma câmera mal posicionada ou com iluminação inadequada continuará entregando imagens ruins. Lente, alcance infravermelho e taxa de gravação também importam.",
        ],
      },
      {
        title: "Planeje gravação e alimentação",
        paragraphs: [
          "Dimensione o armazenamento conforme a quantidade de câmeras e os dias de retenção desejados. Fontes subdimensionadas e conectores expostos são causas comuns de falhas intermitentes.",
        ],
      },
    ],
  },
  {
    slug: "portao-automatico-falha-no-mesmo-ponto",
    tag: "Portões",
    title: "Por que seu portão automático falha sempre no mesmo ponto",
    date: "02 Jun 2026",
    isoDate: "2026-06-02",
    excerpt:
      "Sintomas comuns que indicam problemas em central, capacitor, fim de curso ou cremalheira.",
    introduction:
      "Quando a falha acontece sempre no mesmo trecho, normalmente existe uma causa mecânica ou de leitura de fim de curso que pode ser identificada antes de trocar o motor.",
    sections: [
      {
        title: "Observe o comportamento",
        paragraphs: [
          "Ruído, perda de força, travamento e retorno inesperado são pistas diferentes. Grave um vídeo curto da falha e evite insistir no acionamento quando houver esforço excessivo.",
        ],
      },
      {
        title: "Causas frequentes",
        paragraphs: [
          "Uma avaliação técnica deve verificar o conjunto inteiro, não apenas a central.",
        ],
        items: [
          "Cremalheira desalinhada ou desgastada.",
          "Capacitor com perda de capacidade.",
          "Fim de curso fora de posição.",
          "Trilho com sujeira, desnível ou obstáculo.",
          "Motor incompatível com o peso do portão.",
        ],
      },
      {
        title: "Quando parar de usar",
        paragraphs: [
          "Se houver cheiro de queimado, aquecimento anormal, estalos ou risco de queda, desligue o equipamento e solicite avaliação. Continuar usando pode ampliar o dano.",
        ],
      },
    ],
  },
  {
    slug: "dr-e-dps-por-que-precisa-dos-dois",
    tag: "Elétrica",
    title: "DR e DPS: por que sua instalação precisa dos dois",
    date: "24 Mai 2026",
    isoDate: "2026-05-24",
    excerpt:
      "A diferença entre proteção contra choque e proteção contra surto, explicada sem enrolação.",
    introduction:
      "DR e DPS têm funções diferentes e complementares. Um protege principalmente pessoas; o outro ajuda a proteger equipamentos contra surtos elétricos.",
    sections: [
      {
        title: "O papel do DR",
        paragraphs: [
          "O dispositivo diferencial residual identifica fuga de corrente e desarma o circuito. Ele é especialmente importante em áreas molhadas e pontos com maior risco de choque.",
        ],
      },
      {
        title: "O papel do DPS",
        paragraphs: [
          "O dispositivo de proteção contra surtos desvia picos de tensão causados por descargas atmosféricas ou manobras na rede, reduzindo o risco de dano a equipamentos.",
        ],
      },
      {
        title: "A instalação precisa ser avaliada",
        paragraphs: [
          "Os dispositivos devem ser dimensionados e instalados junto de aterramento e proteção adequados. Não faça alterações no quadro energizado sem profissional qualificado.",
        ],
      },
    ],
  },
  {
    slug: "camera-reinicia-pode-ser-a-fonte",
    tag: "Fontes",
    title: "Sua câmera reinicia sozinha? Pode ser a fonte",
    date: "12 Mai 2026",
    isoDate: "2026-05-12",
    excerpt: "Como identificar alimentação subdimensionada que compromete o sistema inteiro.",
    introduction:
      "Reinicializações, imagem oscilando e perda de sinal à noite frequentemente apontam para queda de tensão ou fonte trabalhando acima da capacidade.",
    sections: [
      {
        title: "Por que o problema aparece à noite",
        paragraphs: [
          "Ao ativar o infravermelho, a câmera consome mais energia. Uma fonte no limite pode funcionar durante o dia e falhar quando todas as câmeras aumentam o consumo.",
        ],
      },
      {
        title: "O que deve ser medido",
        paragraphs: [
          "O diagnóstico considera tensão sob carga, corrente disponível, distância do cabo, qualidade dos conectores e estado da fonte.",
        ],
      },
      {
        title: "Evite trocas por tentativa",
        paragraphs: [
          "Trocar câmera, DVR ou conectores sem medir a alimentação aumenta custo e pode manter a causa original. O teste sob carga direciona a solução correta.",
        ],
      },
    ],
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "camera-reiniciando-alimentacao-poe",
    tag: "Segurança eletrônica",
    title: "Câmera reiniciando: o que observar antes de trocar a fonte",
    date: "14 set. 2026",
    isoDate: "2026-09-14",
    excerpt:
      "Horário da falha, alimentação e rede ajudam a separar as causas de uma câmera que perde a imagem ou reinicia. Saiba o que registrar para a avaliação técnica.",
    introduction:
      "Horário da falha, alimentação e rede ajudam a separar as causas de uma câmera que perde a imagem ou reinicia. Saiba o que registrar para a avaliação técnica.",
    html: '<h2>Perder a imagem não significa sempre reiniciar</h2><p>A câmera desaparece do aplicativo e volta alguns minutos depois. Esse sintoma merece atenção, mas sozinho não identifica o defeito. A interrupção pode estar na alimentação, no caminho de rede ou no acesso remoto. Antes de comprar outra câmera, vale reunir informações que permitam comparar essas possibilidades.</p><p>No seu guia de diagnóstico, a Axis separa a verificação dos indicadores de energia e de conexão. Se a energia está presente e o enlace de rede não aparece, a investigação muda de direção. Observe apenas os indicadores acessíveis e o aplicativo; não abra fontes, caixas ou equipamentos instalados em altura. Consulte o <a href="https://www.axis.com/files/feature_articles/ar_troubleshooting_axis_cameras_58070_en_1405_hi.pdf">guia de hardware e conexão da Axis</a>.</p><h2>Registre quando e onde a falha acontece</h2><ul><li>Acontece com uma câmera ou com todas ao mesmo tempo?</li><li>A gravação local também para ou somente o aplicativo perde acesso?</li><li>Há um horário recorrente, chuva ou mudança recente na instalação?</li><li>Qual é o modelo da câmera, da fonte ou do switch?</li><li>Quanto tempo a imagem demora para voltar?</li></ul><p>Anote dois ou três episódios com horário e duração. Uma captura da mensagem de erro ajuda mais que a descrição genérica de que o sistema está ruim. Preserve as gravações que ainda estiverem disponíveis e não restaure o equipamento para o padrão de fábrica antes da avaliação.</p><h2>Em sistemas PoE, olhe para o conjunto</h2><p>No PoE, o cabo de rede também transporta energia. É preciso compatibilidade entre câmera e equipamento alimentador, capacidade suficiente por porta e potência total disponível para os dispositivos conectados. A TP-Link explica que ultrapassar esse orçamento de potência pode causar instabilidade ou impedir o funcionamento. Adicionar outra câmera pode, portanto, exigir nova avaliação do switch. Veja a <a href="https://www.tp-link.com/fr/support/faq/3489/">explicação técnica sobre orçamento PoE da TP-Link</a>.</p><p>A aparência do conector não informa sua compatibilidade elétrica. Não faça adaptações nem substitua uma fonte apenas porque o plugue encaixa. Modelo, especificação e condições da instalação precisam fazer parte da escolha.</p><h2>O que pedir na avaliação</h2><p>Solicite uma conclusão que relacione o sintoma aos testes realizados: alimentação, cabo, porta, registros do equipamento e funcionamento local. Peça também a descrição da correção proposta e como será verificada. Isso permite entender por que uma peça precisa ser substituída e o que deverá melhorar depois do serviço.</p><p>Atendimento em Fortaleza e região metropolitana: <a href="https://vsbseguranca.com.br/seguranca-eletronica">conheça a avaliação de segurança eletrônica da VSB</a> e use o botão de WhatsApp da página para informar o modelo, o sintoma e o bairro.</p>',
    service: "segurança eletrônica e câmera reiniciando",
    sections: [],
  },
  {
    slug: "como-escolher-nobreak-equipamentos",
    tag: "Energia",
    title: "Como escolher um nobreak para câmeras, rede e equipamentos",
    date: "14 set. 2026",
    isoDate: "2026-09-14",
    excerpt:
      "Potência e autonomia respondem a perguntas diferentes. Organize os equipamentos e o tempo necessário antes de escolher um nobreak.",
    introduction:
      "Potência e autonomia respondem a perguntas diferentes. Organize os equipamentos e o tempo necessário antes de escolher um nobreak.",
    html: '<h2>Comece pelo que precisa continuar funcionando</h2><p>Um nobreak pode manter equipamentos ligados durante uma interrupção de energia. A escolha começa pelo objetivo: preservar a gravação das câmeras, manter parte da rede disponível ou ganhar tempo para desligar um sistema. Escrever essa prioridade evita comparar produtos que atendem necessidades diferentes.</p><p>Faça uma lista dos equipamentos envolvidos. Para a rede, verifique quais aparelhos participam do caminho até a internet. Para a gravação, considere as câmeras e o gravador. O orçamento deve explicar quais componentes receberão alimentação de reserva e quais continuarão dependentes da energia convencional.</p><h2>Confira watts, VA e autonomia</h2><p>Watts e volt-amperes, indicados como W e VA, não são medidas intercambiáveis. A carga conectada deve respeitar ambos os limites do nobreak. A autonomia é o tempo durante o qual ele sustenta determinada carga; ela diminui conforme aumenta o consumo dos equipamentos. Por isso, um número alto de VA não informa sozinho quantos minutos o conjunto ficará ligado. A <a href="https://www.apc.com/us/en/support/product-support/ups-buying-guide-for-selecting-a-battery-backup-system.jsp">APC explica esses critérios no guia de seleção de nobreaks</a>.</p><p>Peça a estimativa de autonomia correspondente à carga do seu projeto, acompanhada do modelo e das condições consideradas. Compare propostas usando o mesmo conjunto de aparelhos e o mesmo objetivo de tempo. Uma estimativa sem essas informações é difícil de conferir.</p><h2>Use este roteiro antes da compra</h2><ul><li>Liste marca e modelo de cada aparelho que deverá ficar ligado.</li><li>Defina o tempo necessário para continuar a operação ou encerrá-la.</li><li>Confirme a tensão disponível e a compatibilidade indicada nos manuais.</li><li>Informe o local de instalação e o espaço para ventilação.</li><li>Peça a relação dos equipamentos incluídos na previsão de autonomia.</li><li>Solicite informações sobre manutenção e reposição da bateria.</li></ul><h2>A bateria também precisa de acompanhamento</h2><p>A autonomia obtida ao longo do tempo depende do estado da bateria e das condições de uso. A APC aponta temperatura, quantidade de descargas e envelhecimento entre os fatores que influenciam a vida útil de baterias VRLA. A orientação de um modelo não deve ser aplicada automaticamente a outro tipo de bateria. Consulte as <a href="https://www.apc.com/us/en/faqs/FA158934/">orientações da APC sobre baterias VRLA</a> e o manual do equipamento escolhido.</p><p>Guarde a data de instalação e registre alertas ou redução perceptível do tempo de funcionamento. A verificação deve ser planejada para evitar interrupções inesperadas; não abra o nobreak para testar seus circuitos.</p><p>A VSB avalia necessidades de alimentação e continuidade em Fortaleza e região metropolitana. Na <a href="https://vsbseguranca.com.br/energia">página de energia</a>, use o WhatsApp para enviar a lista de equipamentos, o tempo desejado e o bairro.</p>',
    service: "nobreaks e alimentação de equipamentos",
    sections: [],
  },
  {
    slug: "conexao-caindo-rede-cabeamento",
    tag: "Telecomunicações",
    title: "Conexão caindo: como separar falhas de Wi-Fi, cabo e operadora",
    date: "14 set. 2026",
    isoDate: "2026-09-14",
    excerpt:
      "Uma comparação organizada entre aparelhos e tipos de conexão ajuda a localizar a falha sem trocar o roteador por tentativa.",
    introduction:
      "Uma comparação organizada entre aparelhos e tipos de conexão ajuda a localizar a falha sem trocar o roteador por tentativa.",
    html: '<h2>Descubra o alcance do problema</h2><p>Uma chamada trava, a câmera fica indisponível ou o computador perde acesso. A descrição parece a mesma, mas o ponto de falha pode ser diferente. O primeiro passo é identificar quem foi afetado: um aparelho, todos os dispositivos no Wi-Fi ou também os conectados por cabo.</p><p>A TP-Link usa essa distinção em seu diagnóstico de conexão instável. Se apenas a rede sem fio falha, a investigação deve se concentrar nesse caminho. Quando cabo e Wi-Fi caem juntos, é necessário examinar os componentes compartilhados e o acesso da operadora. Veja o <a href="https://www.tp-link.com/us/support/faq/2237/">guia da TP-Link para conexão instável</a>.</p><h2>Monte um registro simples</h2><ul><li>Anote o horário e a duração de cada interrupção.</li><li>Identifique o aparelho e se ele usa cabo ou Wi-Fi.</li><li>Observe se outros dispositivos continuam funcionando no mesmo instante.</li><li>Registre a mensagem exibida, sem incluir senhas nas capturas.</li><li>Informe mudanças recentes de equipamento, local ou instalação.</li></ul><p>Esse registro ajuda a comparar ocorrências. Dizer que a falha começou depois de mover um computador é mais útil do que afirmar apenas que a internet está lenta. Evite fazer várias mudanças simultâneas, porque depois fica difícil relacionar o resultado a uma delas.</p><h2>Quando suspeitar do trecho cabeado</h2><p>Se houver um cabo de rede acessível e a conexão puder ser interrompida, uma comparação com outro cabo conhecido e compatível ajuda a investigar esse trecho. Anote o resultado e mantenha a identificação das portas. Não remova conexões de equipamentos compartilhados sem combinar a interrupção. A TP-Link descreve testes por cabo, porta e dispositivo em seu <a href="https://www.tp-link.com/uk/support/faq/3124/">roteiro para falhas de Ethernet</a>.</p><p>Um indicador de conexão aceso ou um teste básico de continuidade não comprova sozinho todo o desempenho do cabeamento. A Fluke Networks distingue verificação de continuidade, qualificação da aplicação e certificação dos enlaces. Cada nível responde a uma pergunta diferente. Conheça a <a href="https://www.flukenetworks.com/expertise/learn-about/cable-testing">explicação da Fluke Networks sobre testes de cabos</a>.</p><h2>Peça um diagnóstico com evidências</h2><p>Na avaliação, peça que sejam identificados os pontos examinados, os sintomas reproduzidos e o critério usado para concluir a causa. Se a indicação for substituir cabeamento ou equipamento, solicite a justificativa e uma comparação do funcionamento antes e depois. Isso torna o resultado do serviço verificável.</p><p>Guarde também protocolos de atendimento da operadora e horários das ocorrências, quando houver. Eles ajudam a conectar a avaliação da instalação ao suporte do acesso contratado.</p><p>Para redes em Fortaleza e região metropolitana, acesse <a href="https://vsbseguranca.com.br/telecomunicacoes">telecomunicações na VSB</a> e envie pelo WhatsApp o tipo de conexão, os dispositivos afetados e o bairro.</p>',
    service: "rede e conexão instável",
    sections: [],
  },
  ...LEGACY_BLOG_POSTS,
];

export function findBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function isPlaceholderPost(slug: string) {
  return /^(hello-world|ola-mundo)(-\d+)?$/.test(slug);
}

export function blogCategory(value?: string) {
  return !value || /^(uncategorized|sem categoria)$/i.test(value.trim()) ? "Conteúdo VSB" : value;
}
