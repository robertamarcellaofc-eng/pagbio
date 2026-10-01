/**
 * ===================================================================
 * ROBERTA MARCELA ESTÉTICA - JAVASCRIPT PRINCIPAL
 * ===================================================================
 */

/* ─── 1. CARREGAMENTO DOS ÍCONES LUCIDE (COM FALLBACK DE CDNs) ──── */
(function loadLucide(sources, index) {
      if (index >= sources.length) return; // esgotou as opções; o restante do
      // código já trata a ausência dos
      // ícones sem quebrar a página
      var script = document.createElement('script');
      script.src = sources[index];
      script.onload = function () {
        try { if (window.lucide) lucide.createIcons(); } catch (e) { /* tentaremos de novo no DOMContentLoaded */ }
      };
      script.onerror = function () {
        loadLucide(sources, index + 1);
      };
      document.head.appendChild(script);
    })([
      'https://unpkg.com/lucide@0.469.0/dist/umd/lucide.js',
      'https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.js'
    ], 0);

/* ─── 2. INTERATIVIDADE DA PÁGINA (PLAYER, CARROSSEL, FAQ, ANIMAÇÕES) ──── */
// Chama lucide.createIcons() com segurança: se a biblioteca de ícones
    // ainda não carregou (rede lenta, CDN bloqueado, etc.), simplesmente não
    // faz nada — sem lançar erro nem poluir o console. Usada em todo o
    // restante do código sempre que ícones precisam ser (re)desenhados.
    function safeCreateIcons() {
      if (window.lucide && typeof lucide.createIcons === 'function') {
        try { lucide.createIcons(); } catch (e) { /* segue sem os ícones */ }
      }
    }

    /* =========================================================
    /* =========================================================
       PLAYER DE VÍDEO — 100% funcional e tolerante a erros
       ========================================================= */

    function getVideoUrl() {
      if (window.CONFIG_ROBERTA && window.CONFIG_ROBERTA.videoUrl) {
        return window.CONFIG_ROBERTA.videoUrl.trim();
      }
      return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }

    // Extrai o ID de 11 caracteres de qualquer formato do YouTube ou URL
    function extractYouTubeId(url) {
      if (!url) return null;
      const trimmed = String(url).trim();
      const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
      if (match && match[1]) return match[1];
      if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
      return null;
    }

    function getVideoId() {
      return extractYouTubeId(getVideoUrl());
    }

    let ytPlayer = null;
    let ytApiReady = false;
    let ytApiUnavailable = false;

    // Miniatura oficial do vídeo do YouTube como capa (ou mantém a imagem de reserva)
    function setupVideoThumbnail() {
      const vId = getVideoId();
      if (!vId) return;
      const img = document.getElementById('videoCoverImg');
      if (!img) return;
      const hiRes = new Image();
      hiRes.onload = function () {
        if (hiRes.naturalWidth > 120) {
          img.src = `https://img.youtube.com/vi/${vId}/maxresdefault.jpg`;
        }
      };
      hiRes.src = `https://img.youtube.com/vi/${vId}/maxresdefault.jpg`;
    }

    function loadYouTubeApi() {
      const vId = getVideoId();
      if (!vId) return;
      const timeout = setTimeout(function () {
        if (!ytApiReady) ytApiUnavailable = true;
      }, 3500);

      window.onYouTubeIframeAPIReady = function () {
        clearTimeout(timeout);
        ytApiReady = true;
      };

      try {
        if (window.YT && window.YT.Player) {
          ytApiReady = true;
          return;
        }
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = function () {
          clearTimeout(timeout);
          ytApiUnavailable = true;
        };
        document.head.appendChild(tag);
      } catch (e) {
        clearTimeout(timeout);
        ytApiUnavailable = true;
      }
    }

    // Iframe padrão de fallback caso a API dê erro ou o vídeo tenha restrições
    function insertFallbackIframe() {
      const mount = document.getElementById('youtubePlayerMount');
      if (!mount) return;
      mount.innerHTML = '';
      const vUrl = getVideoUrl();
      const vId = getVideoId();

      // Suporte a arquivo de vídeo direto (.mp4)
      if (vUrl && (vUrl.endsWith('.mp4') || vUrl.includes('.mp4?'))) {
        mount.innerHTML = `<video src="${vUrl}" autoplay controls playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:none;"></video>`;
        return;
      }

      const iframe = document.createElement('iframe');
      const originParam = window.location.origin ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
      iframe.src = `https://www.youtube.com/embed/${vId || 'dQw4w9WgXcQ'}?autoplay=1&rel=0&playsinline=1&modestbranding=1${originParam}`;
      iframe.title = 'Apresentação Dra. Roberta Marcella Estética';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.border = 'none';
      mount.appendChild(iframe);
    }

    function enableCustomControls() {
      const box = document.getElementById('videoRatioBox');
      if (box) box.classList.add('custom-controls');
    }

    function updatePlayPauseIcon(isPlaying) {
      const btn = document.getElementById('btnPlayPause');
      if (!btn) return;
      btn.innerHTML = isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
      btn.setAttribute('aria-label', isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo');
      safeCreateIcons();
    }

    function updateMuteIcon(isMuted) {
      const btn = document.getElementById('btnMute');
      if (!btn) return;
      btn.innerHTML = isMuted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
      btn.setAttribute('aria-label', isMuted ? 'Ativar áudio' : 'Silenciar vídeo');
      safeCreateIcons();
    }

    function onPlayerStateChange(event) {
      if (window.YT && event.data === YT.PlayerState.PLAYING) updatePlayPauseIcon(true);
      else if (window.YT && (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED)) updatePlayPauseIcon(false);
    }

    // Inicia o vídeo no player do YouTube em loop mutado automaticamente
    function initBackgroundVideo() {
      const vId = getVideoId();
      const vUrl = getVideoUrl();
      const mount = document.getElementById('youtubePlayerMount');
      if (!mount) return;

      // Suporte direto para arquivos MP4
      if (vUrl && (vUrl.endsWith('.mp4') || vUrl.includes('.mp4?'))) {
        mount.innerHTML = `<video id="bgDirectVideo" src="${vUrl}" autoplay loop muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:none;"></video>`;
        return;
      }

      if (!vId) return;

      function createPlayer() {
        try {
          ytPlayer = new YT.Player('youtubePlayerMount', {
            videoId: vId,
            playerVars: {
              autoplay: 1,
              mute: 1,
              loop: 1,
              playlist: vId,
              controls: 0,
              showinfo: 0,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              enablejsapi: 1
            },
            events: {
              onReady: function (e) {
                try {
                  e.target.mute();
                  e.target.playVideo();
                } catch (err) {}
                enableCustomControls();
                updatePlayPauseIcon(true);
                updateMuteIcon(true);
              },
              onStateChange: onPlayerStateChange,
              onError: function () {
                insertFallbackIframe();
              }
            }
          });
        } catch (e) {
          insertFallbackIframe();
        }
      }

      if (window.YT && window.YT.Player) {
        createPlayer();
      } else {
        const checkYt = setInterval(function () {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYt);
            createPlayer();
          } else if (ytApiUnavailable) {
            clearInterval(checkYt);
            insertFallbackIframe();
          }
        }, 100);
      }
    }

    // Reprodução interativa: ao clicar na capa, esconde a capa e desmuta com som ativo
    function playVideo() {
      const cover = document.getElementById('videoCoverLayer');
      const box = document.getElementById('videoRatioBox');
      if (cover) cover.classList.add('is-active');
      if (box) box.classList.add('is-active');

      const directVideo = document.getElementById('bgDirectVideo');
      if (directVideo) {
        directVideo.muted = false;
        directVideo.play();
        return;
      }

      if (ytPlayer && typeof ytPlayer.unMute === 'function') {
        try {
          ytPlayer.unMute();
          ytPlayer.playVideo();
          updateMuteIcon(false);
          updatePlayPauseIcon(true);
          return;
        } catch (e) {
          insertFallbackIframe();
          return;
        }
      }

      // Se ainda não estava inicializado, chama fallback ou recria com áudio
      insertFallbackIframe();
    }

    // Botão de play/pausa customizado
    function toggleVideoPlayPause(event) {
      if (event) event.stopPropagation();
      const directVideo = document.getElementById('bgDirectVideo');
      if (directVideo) {
        if (directVideo.paused) {
          directVideo.play();
          updatePlayPauseIcon(true);
        } else {
          directVideo.pause();
          updatePlayPauseIcon(false);
        }
        return;
      }
      if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') return;
      const state = ytPlayer.getPlayerState();
      if (window.YT && state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
        updatePlayPauseIcon(false);
      } else {
        ytPlayer.playVideo();
        updatePlayPauseIcon(true);
      }
    }

    // Botão de mudo/áudio customizado
    function toggleVideoMute(event) {
      if (event) event.stopPropagation();
      const directVideo = document.getElementById('bgDirectVideo');
      if (directVideo) {
        directVideo.muted = !directVideo.muted;
        updateMuteIcon(directVideo.muted);
        return;
      }
      if (!ytPlayer || typeof ytPlayer.isMuted !== 'function') return;
      if (ytPlayer.isMuted()) {
        ytPlayer.unMute();
        updateMuteIcon(false);
      } else {
        ytPlayer.mute();
        updateMuteIcon(true);
      }
    }

    // Permite acionar a capa do vídeo também pelo teclado (Enter / Espaço)
    function handleVideoCoverKeydown(event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        playVideo();
      }
    }

    // FAQ Accordion — abre/fecha com animação suave
    function toggleFaq(id) {
      const allItems = document.querySelectorAll('.faq-item');
      const clickedItem = document.getElementById(id);
      const isOpen = clickedItem.classList.contains('open');

      // Fecha todos os itens
      allItems.forEach(item => {
        item.classList.remove('open');
        const btn = item.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      // Se o item clicado não estava aberto, abre ele
      if (!isOpen) {
        clickedItem.classList.add('open');
        const btn = clickedItem.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      }

      // Re-inicializa ícones Lucide (ícones do chevron podem mudar dinamicamente)
      safeCreateIcons();
    }

    // Cards de depoimentos sobrepostos: ao selecionar um (clique, toque ou
    // teclado — não depende de mouse), ele se destaca na frente dos outros
    // dois, que ficam desfocados. Selecionar de novo o mesmo card desfaz
    // a seleção e volta ao empilhado normal.
    // Carrossel de depoimentos: mostra um depoimento por vez, com o
    // comentário sempre visível por inteiro. Troca sozinho de tempos em
    // tempos e também pelas setas, pelas bolinhas, arrastando com o dedo
    // ou pelas setas do teclado. O avanço automático pausa quando a
    // pessoa interage (mouse em cima, foco no teclado, dedo na tela) e
    // quando a aba do navegador não está visível.
    function setupTestimonialsCarousel() {
      const carousel = document.querySelector('.testi-carousel');
      if (!carousel) return;

      const track = carousel.querySelector('.testi-track');
      const slides = Array.from(carousel.querySelectorAll('.testi-slide'));
      const dotsBox = carousel.querySelector('.testi-dots');
      const viewport = carousel.querySelector('.testi-viewport');
      if (!track || slides.length === 0) return;

      const AUTOPLAY_MS = 6500;
      const prefersReducedMotion = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let index = 0;
      let timer = null;
      let paused = false;
      let dragged = false; // marca que o último gesto foi um arraste, não um toque

      // Marca que o JavaScript assumiu: só então as animações escalonadas
      // do conteúdo entram em cena (sem JS, tudo continua visível)
      carousel.classList.add('js-ready');

      // Monta as bolinhas de navegação abaixo da pilha
      const dots = slides.map((_, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'testi-dot';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-label', `Ver depoimento ${i + 1} de ${slides.length}`);
        btn.addEventListener('click', () => {
          goTo(i);
          restart();
        });
        if (dotsBox) dotsBox.appendChild(btn);
        return btn;
      });

      function goTo(next) {
        index = (next + slides.length) % slides.length;

        // Os cards ficam empilhados no mesmo lugar; o que muda é a
        // "profundidade" de cada um. O escolhido recebe profundidade 0
        // (vem para a frente de todos) e os demais vão ficando atrás, na
        // ordem da lista, dando a volta quando chega ao fim.
        slides.forEach((slide, i) => {
          const active = i === index;
          const depth = (i - index + slides.length) % slides.length;
          slide.style.setProperty('--depth', depth);
          slide.classList.toggle('is-active', active);
          // Os depoimentos que estão atrás não devem ser lidos por leitores
          // de tela nem receber foco por tabulação
          slide.setAttribute('aria-hidden', active ? 'false' : 'true');
          slide.inert = !active;
        });

        dots.forEach((btn, i) => {
          const active = i === index;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      }

      function next() { goTo(index + 1); }
      function prev() { goTo(index - 1); }

      function stop() {
        if (timer) { clearInterval(timer); timer = null; }
      }

      function start() {
        // Quem pediu "reduzir movimento" no sistema não recebe troca automática
        if (prefersReducedMotion || paused || timer) return;
        timer = setInterval(next, AUTOPLAY_MS);
      }

      function restart() { stop(); start(); }

      // Tocar/clicar na própria pilha manda o card da frente para trás e
      // traz o de trás para a frente — como folhear uma pasta de arquivos.
      // (Só conta como clique se não foi um arraste; ver "pointerup" abaixo.)
      if (viewport) {
        viewport.addEventListener('click', (event) => {
          if (event.target.closest('a, button')) return; // não atrapalha links
          if (dragged) { dragged = false; return; }
          next();
          restart();
        });
      }

      // Pausa enquanto a pessoa está interagindo
      ['mouseenter', 'focusin', 'touchstart'].forEach(evt => {
        carousel.addEventListener(evt, () => { paused = true; stop(); }, { passive: true });
      });
      ['mouseleave', 'focusout'].forEach(evt => {
        carousel.addEventListener(evt, () => { paused = false; start(); });
      });

      // Não fica trocando de slide com a aba em segundo plano
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
      });

      // Setas do teclado
      carousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); restart(); }
        else if (event.key === 'ArrowRight') { event.preventDefault(); next(); restart(); }
      });

      // Arrastar com o dedo (ou com o mouse) para folhear a pilha
      let startX = null;
      track.addEventListener('pointerdown', (event) => { startX = event.clientX; }, { passive: true });
      track.addEventListener('pointerup', (event) => {
        if (startX === null) return;
        const delta = event.clientX - startX;
        startX = null;
        if (Math.abs(delta) < 40) return; // movimento curto demais: foi um toque, não um arraste
        dragged = true; // evita que o clique logo em seguida avance de novo
        if (delta < 0) next(); else prev();
        restart();
      }, { passive: true });
      track.addEventListener('pointercancel', () => { startX = null; }, { passive: true });

      goTo(0);
      start();
    }

    // Aguarda o DOM e o script do Lucide (carregado com "defer") antes de inicializar os ícones,
    // evitando o erro "lucide is not defined" que ocorria quando esse script rodava antes do CDN carregar.
    // Cada inicialização fica em seu próprio try/catch para que uma falha (ex.: CDN de ícones
    // fora do ar) não impeça as outras interações da página de funcionar.
    // Animações de rolagem (entrada + saída) usadas na página inteira, e o
    // efeito de texto entrando palavra por palavra em títulos e rótulos.
    // Quem prefere menos animação (configuração do sistema) não recebe nada
    // disso — o conteúdo já aparece pronto, sem mexer na tela.
    function setupScrollReveal() {
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Envolve cada palavra de um elemento .reveal-text em <span class="word">,
      // preservando ícones/elementos filhos que já existam (só o texto é dividido).
      document.querySelectorAll('.reveal-text').forEach(el => {
        const baseDelay = parseFloat(el.getAttribute('data-delay-base') || '0');
        let wordIndex = 0;
        Array.from(el.childNodes).forEach(node => {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          const parts = node.textContent.split(/(\s+)/); // mantém os espaços
          parts.forEach(part => {
            if (part.trim() === '') {
              frag.appendChild(document.createTextNode(part));
            } else {
              const span = document.createElement('span');
              span.className = 'word';
              span.textContent = part;
              span.style.transitionDelay = (baseDelay + wordIndex * 0.035) + 's';
              frag.appendChild(span);
              wordIndex++;
            }
          });
          node.replaceWith(frag);
        });
      });

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        // Sem observer disponível (ou o usuário pediu menos animação):
        // deixa tudo visível de uma vez, sem depender de rolagem.
        document.querySelectorAll('.reveal, .reveal-fade, .reveal-text, .bio-btn, .faq-item, .hero-cta-button')
          .forEach(el => el.classList.add('in-view'));
        return;
      }

      const targets = document.querySelectorAll(
        '.reveal, .reveal-fade, .reveal-text, .bio-hero-card, .bio-btn, .faq-item, .hero-cta-button'
      );

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // Entra na tela → aparece; sai da tela (pra cima ou pra baixo) →
          // volta a ficar escondido, pronto para animar de novo na próxima vez.
          entry.target.classList.toggle('in-view', entry.isIntersecting);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

      targets.forEach(el => observer.observe(el));
    }

    /* ===== BARRA DE PROGRESSO ANIMADA (SCROLL INDICATOR) ===== */
    function setupScrollProgress() {
      const bar = document.getElementById('headerProgressBar');
      if (!bar) return;
      const updateProgress = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const percent = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
          bar.style.width = percent + '%';
        }
      };
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    /* ===== VOLTAR AO TOPO ===== */
    function setupBackTop() {
      const btn = document.getElementById('backTop');
      if (!btn) return;
      const toggle = () => btn.classList.toggle('visible', window.scrollY > 320);
      window.addEventListener('scroll', toggle, { passive: true });
      toggle();
    }

    document.addEventListener('DOMContentLoaded', () => {
      safeCreateIcons();
      try { setupScrollProgress(); } catch (e) { console.error('Falha ao iniciar barra de progresso:', e); }
      try { setupTestimonialsCarousel(); } catch (e) { console.error('Falha ao iniciar depoimentos:', e); }
      try { setupScrollReveal(); } catch (e) { console.error('Falha ao iniciar animações de rolagem:', e); }
      try { setupVideoThumbnail(); } catch (e) { console.error('Falha ao carregar miniatura do vídeo:', e); }
      try { loadYouTubeApi(); } catch (e) { console.error('Falha ao carregar API do YouTube:', e); }
      try { initBackgroundVideo(); } catch (e) { console.error('Falha ao inicializar vídeo em loop:', e); }
      try { setupBackTop(); } catch (e) { console.error('Falha ao iniciar botão voltar ao topo:', e); }
      try { setupDynamicTabTitle(); } catch (e) { console.error('Falha no título dinâmico:', e); }
      try { setupInteractiveGlow(); } catch (e) { console.error('Falha no glow interativo:', e); }
    });

/* ─── 3. MODAL DE AGENDAMENTO E INTEGRAÇÃO WHATSAPP ────────────── */

/* ─── CONFIGURAÇÃO ─────────────────────────────────────────── */
const WHATSAPP_NUMERO = (window.CONFIG_ROBERTA && window.CONFIG_ROBERTA.whatsappNumero) || '5582993535363';

/* ─── TIRAR DÚVIDAS DIRETO NO WHATSAPP (FAQ CTA) ──────────── */
function abrirDuvidasWhatsApp(e) {
  if (e && e.preventDefault) e.preventDefault();
  const num = (window.CONFIG_ROBERTA && window.CONFIG_ROBERTA.whatsappNumero) || WHATSAPP_NUMERO;
  const texto = encodeURIComponent("Olá! Gostaria de tirar algumas dúvidas sobre os tratamentos e protocolos da Dra. Roberta Marcella.");
  window.open('https://wa.me/' + num + '?text=' + texto, '_blank', 'noopener,noreferrer');
}

/* ─── TÍTULO DINÂMICO E INTERATIVO DA ABA (ALTERNÂNCIA) ─────── */
function setupDynamicTabTitle() {
  const titulos = (window.CONFIG_ROBERTA && window.CONFIG_ROBERTA.titulosAba) || [
    "Dra. Roberta Marcella | Estética Avançada",
    "✨ Olá, seja muito bem-vinda(o)!",
    "Dra. Roberta Marcella | Estética Avançada",
    "💖 Cuidado que valoriza sua beleza"
  ];
  let idx = 0;
  const tempo = (window.CONFIG_ROBERTA && window.CONFIG_ROBERTA.tempoTrocaTituloMs) || 3400;

  setInterval(function() {
    idx = (idx + 1) % titulos.length;
    document.title = titulos[idx];
  }, tempo);

  // Efeito sofisticado ao trocar de aba:
  window.addEventListener('blur', function() {
    document.title = "✦ Volte aqui! Dra. Roberta Marcella";
  });
  window.addEventListener('focus', function() {
    document.title = titulos[idx];
  });
}

/* ─── EFEITO GLOW SEGUINDO O MOUSE NAS SEÇÕES INTERATIVAS ───── */
function setupInteractiveGlow() {
  const glowElements = document.querySelectorAll('.bio-hero-card');
  glowElements.forEach(function(card) {
    function updateCoords(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    }
    card.addEventListener('mousemove', updateCoords, { passive: true });
    card.addEventListener('mouseenter', updateCoords, { passive: true });
  });
}
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { setupInteractiveGlow(); } catch (e) {}
}

/* ─── ROLAR PARA SEÇÃO DE AGENDAMENTO / ABRIR MODAL ──────── */
function irParaAgendar() {
  openAgendamento();
  const secao = document.getElementById('secao-agendar');
  if (secao) {
    const top = secao.getBoundingClientRect().top + window.scrollY - 32;
    window.scrollTo({ top, behavior: 'smooth' });
  }
  const card = document.querySelector('#secao-agendar .bio-hero-card');
  if (!card) return;
  card.classList.remove('em-destaque');
  void card.offsetWidth;
  setTimeout(() => {
    card.classList.add('em-destaque');
    setTimeout(() => card.classList.remove('em-destaque'), 3400);
  }, 750);
}

/* ─── ABRIR / FECHAR MODAL ─────────────────────────────────── */
function openAgendamento() {
  var overlay = document.getElementById('agendOverlay');
  var success = document.getElementById('agendSuccess');
  var form = document.getElementById('agendForm');
  var header = document.querySelector('.agend-header');
  if (!overlay) return;

  if (success) { success.style.display = 'none'; success.classList.remove('is-visible'); }
  if (form) form.style.display = '';
  if (header) header.style.display = '';

  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  setTimeout(function () {
    var primeiro = document.getElementById('agend-nome');
    if (primeiro) primeiro.focus();
  }, 350);
}

function closeAgendamento() {
  var overlay = document.getElementById('agendOverlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

var overlay = document.getElementById('agendOverlay');
if (overlay) {
  overlay.addEventListener('click', function (e) {
    if (e.target === this) closeAgendamento();
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeAgendamento();
});

/* ─── VALIDAÇÃO ────────────────────────────────────────────── */
function validarCampo(id, teste) {
  var field = document.getElementById('field-' + id);
  var el = document.getElementById('agend-' + id);
  if (!el) return true;
  var val = el.value.trim();
  var ok = teste(val);
  if (field) field.classList.toggle('has-error', !ok);
  return ok;
}

/* ─── ENVIAR AGENDAMENTO PELO WHATSAPP ─────────────────────── */
function enviarAgendamento(e) {
  e.preventDefault();

  var nome = document.getElementById('agend-nome').value.trim();
  var sexoEl = document.getElementById('agend-sexo');
  var sexo = sexoEl ? sexoEl.value : 'Feminino';
  var idadeEl = document.getElementById('agend-idade');
  var idade = idadeEl ? idadeEl.value : '18+';
  var cidadeEl = document.getElementById('agend-cidade');
  var cidade = cidadeEl ? cidadeEl.value.trim() : '';
  var proc = document.getElementById('agend-proc').value;
  var obs = (document.getElementById('agend-obs') || {}).value || '';
  obs = obs.trim();

  var okNome = validarCampo('nome', function (v) { return v.length >= 2; });
  var okCidade = validarCampo('cidade', function (v) { return v.length >= 2; });
  var okProc = validarCampo('proc', function (v) { return v !== ''; });

  if (!okNome || !okCidade || !okProc) {
    var erroEl = document.querySelector('.agend-field.has-error');
    if (erroEl) erroEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  /* Montar mensagem formatada */
  var saudacao = 'Olá!';
  if (sexo === 'Feminino') { saudacao = 'Olá, bom dia! Sou a ' + nome + '.'; }
  else if (sexo === 'Masculino') { saudacao = 'Olá, eu sou o ' + nome + '.'; }
  else { saudacao = 'Olá, eu sou ' + nome + '.'; }

  var textoIdade = (idade === '18+') ? 'Tenho mais de 18 anos' : 'Tenho menos de 18 anos';

  var msg = saudacao + ' ' + textoIdade + ' e moro em ' + cidade + '.\n\n';
  msg += 'Gostaria de agendar uma avaliação para o procedimento: *' + proc + '*.\n';
  
  if (obs) msg += '\n💬 *Observação:* ' + obs + '\n';

  /* Abre WhatsApp diretamente */
  var url = 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
  var link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  /* Sucesso */
  var header = document.querySelector('.agend-header');
  var form = document.getElementById('agendForm');
  var success = document.getElementById('agendSuccess');
  if (header) header.style.display = 'none';
  if (form) form.style.display = 'none';
  if (success) { success.style.display = 'flex'; success.classList.add('is-visible'); }

  setTimeout(function () {
    closeAgendamento();
    var f = document.getElementById('agendForm');
    if (f) f.reset();
    document.querySelectorAll('.agend-field.has-error').forEach(function (el) { el.classList.remove('has-error'); });
  }, 2500);
}

