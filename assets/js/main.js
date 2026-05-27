/* ============================================================
   FOT GROUP — Main JS
   Lenis smooth scroll + AOS (parámetros Minnaro) + UI interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ——— LOADER ——— */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader?.classList.add('hidden'), 500);
    document.querySelector('.hero-bg')?.classList.add('loaded');
  });

  /* ——— LENIS — smooth scroll premium ——— */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      smooth: true,
    });

    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);
  }

  /* ——— AOS — parámetros estilo Minnaro ——— */
  if (window.AOS) {
    AOS.init({
      duration: 800,
      easing: 'ease-out-quad',
      once: true,
      offset: 40,
      delay: 0,
      anchorPlacement: 'top-bottom',
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }

  /* ——— NAVBAR + logo swap ——— */
  const navbar     = document.getElementById('navbar');
  const logoBlanco = document.getElementById('logo-blanco');
  const logoDark   = document.getElementById('logo-dark');

  function updateNav() {
    const scrolled = window.scrollY > 50;
    navbar?.classList.toggle('scrolled', scrolled);
    // logo swap ya lo hace CSS, pero reforzamos via JS por si hay FOUC
    if (logoBlanco) logoBlanco.style.opacity = scrolled ? '0' : '1';
    if (logoDark)   logoDark.style.opacity   = scrolled ? '1' : '0';
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ——— SCROLL PROGRESS BAR ——— */
  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = h.scrollHeight === h.clientHeight ? 0
      : (window.scrollY / (h.scrollHeight - h.clientHeight)) * 100;
    if (bar) bar.style.width = pct + '%';
  }, { passive: true });

  /* ——— HAMBURGER ——— */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger?.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-link').forEach(el => {
    el.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileMenu?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ——— SMOOTH SCROLL — anchor links ——— */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 76;
      if (lenis) lenis.scrollTo(top, { duration: 1.3 });
      else window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ——— HERO SCROLL HINT ——— */
  document.getElementById('hero-scroll')?.addEventListener('click', () => {
    const next = document.getElementById('overview');
    if (!next) return;
    const top = next.getBoundingClientRect().top + window.scrollY - 76;
    if (lenis) lenis.scrollTo(top, { duration: 1.3 });
    else window.scrollTo({ top, behavior: 'smooth' });
  });

  /* ——— DESARROLLOS FILTER ——— */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards      = document.querySelectorAll('.project-card[data-status]');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.status === filter;
        card.style.display = show ? '' : 'none';
        if (show) {
          card.style.opacity = '0';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.35s ease-out';
            card.style.opacity = '1';
          });
        }
      });
    });
  });

  /* ——— CONTACT FORM ——— */
  const form  = document.getElementById('contact-form');
  const toast = document.getElementById('toast');

  function showToast(msg, type) {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `show ${type}`;
    setTimeout(() => { toast.className = ''; }, 4200);
  }

  function validateField(el) {
    const err = el.closest('.form-group')?.querySelector('.form-error');
    const empty = !el.value.trim();
    const badEmail = el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);

    if (err) {
      if (empty)     { err.textContent = 'Este campo es obligatorio.'; err.classList.add('visible'); return false; }
      if (badEmail)  { err.textContent = 'Ingresá un email válido.'; err.classList.add('visible'); return false; }
      err.classList.remove('visible');
    }
    return !empty && !badEmail;
  }

  form?.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
    el.addEventListener('blur', () => validateField(el));
    el.addEventListener('input', () => {
      const err = el.closest('.form-group')?.querySelector('.form-error');
      if (el.value.trim()) err?.classList.remove('visible');
    });
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(el => { if (!validateField(el)) valid = false; });
    if (!valid) return;

    const btn = form.querySelector('[type="submit"]');
    const orig = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

    try {
      const res  = await fetch('mail.php', { method: 'POST', body: new FormData(form) });
      const json = await res.json();
      if (json.success) {
        showToast('Mensaje enviado. Te contactaremos pronto.', 'success');
        form.reset();
      } else {
        showToast(json.message || 'Error al enviar. Intentá nuevamente.', 'error');
      }
    } catch {
      showToast('Error de conexión. Verificá tu internet e intentá nuevamente.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = orig; }
    }
  });

  /* ——— ACTIVE NAV LINK on scroll ——— */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[href="#${e.target.id}"]`)?.classList.add('active');
      }
    });
  }, { threshold: 0.35 }).observe && sections.forEach(s =>
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          document.querySelector(`.nav-link[href="#${e.target.id}"]`)?.classList.add('active');
        }
      });
    }, { threshold: 0.35 }).observe(s)
  );

  /* ——— MODAL NOSOTROS ——— */
  const modalNosotros = document.getElementById('modal-nosotros');
  const openModalBtn  = document.getElementById('open-nosotros-modal');
  const closeModalBtn = modalNosotros?.querySelector('.modal-close');
  const modalOverlay  = modalNosotros?.querySelector('.modal-overlay');

  function openModal() {
    modalNosotros?.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeModal() {
    modalNosotros?.classList.remove('open');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  openModalBtn?.addEventListener('click', openModal);
  closeModalBtn?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalNosotros?.classList.contains('open')) {
      closeModal();
    }
  });

});
