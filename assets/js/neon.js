/* === NEON PRO И К — main JS === */

/* ── Telegram config ─────────────────────────── */
const TG_TOKEN   = '8926912364:AAH1bOdoi0YQaDIOwwLloWSyUzAVsOhyGlE';
const TG_CHAT_ID = '-5117095252';
/* ─────────────────────────────────────────────── */

/* ── EmailJS config ── замените на свои данные ── */
const EJS_PUBLIC_KEY  = '_gsb5USAAG4h88vF7';    // Account → Public Key
const EJS_SERVICE_ID  = 'service_awi8xss';
const EJS_TEMPLATE_ID = 'template_p0sw1qm';
/* ─────────────────────────────────────────────── */

async function sendEmail(name, phone, service, message) {
  if (!EJS_SERVICE_ID || !EJS_TEMPLATE_ID || !EJS_PUBLIC_KEY) return;
  await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  EJS_SERVICE_ID,
      template_id: EJS_TEMPLATE_ID,
      user_id:     EJS_PUBLIC_KEY,
      template_params: {
        from_name: name,
        phone,
        service:  service || 'Не указана',
        message:  message || '—',
      },
    }),
  });
}

async function sendToTelegram(name, phone, service, message) {
  const serviceLabel = service || 'Не указана';
  const text =
    `🔔 *Новая заявка с сайта*\n\n` +
    `👤 *Имя:* ${name}\n` +
    `📞 *Телефон:* ${phone}\n` +
    `🏷 *Услуга:* ${serviceLabel}\n` +
    `💬 *Сообщение:* ${message || '—'}\n\n` +
    `📅 ${new Date().toLocaleString('ru-RU')}`;

  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.description || 'Telegram error');
}

/* Header scroll */
const header = document.querySelector('.np-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* Burger menu */
const burger = document.querySelector('.np-burger');
const mobileMenu = document.querySelector('.np-mobile-menu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* Scroll reveal */
const revealEls = document.querySelectorAll('.np-reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));
}

/* Smooth scroll anchors */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* FAQ accordion */
document.querySelectorAll('.np-faq-item').forEach(item => {
  const btn = item.querySelector('.np-faq-q');
  const body = item.querySelector('.np-faq-a');
  if (!btn || !body) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.np-faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.np-faq-a').style.maxHeight = '0';
    });
    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

/* Service cards → prefill form */
document.querySelectorAll('[data-service]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sel = document.querySelector('#np-service-select');
    if (sel) {
      sel.value = btn.dataset.service;
      const section = document.querySelector('#order');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Form validation + submit */
const form = document.querySelector('.np-order-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(field => {
      const err = field.closest('.np-form-group')?.querySelector('.np-form-error');
      const isEmpty = !field.value.trim();
      field.classList.toggle('error', isEmpty);
      if (err) err.classList.toggle('show', isEmpty);
      if (isEmpty) valid = false;
    });

    const cb = form.querySelector('#np-consent');
    const cbErr = form.querySelector('#np-consent-err');
    if (cb && !cb.checked) {
      if (cbErr) cbErr.classList.add('show');
      valid = false;
    } else if (cbErr) {
      cbErr.classList.remove('show');
    }

    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.textContent = 'Отправляем...';
    submitBtn.disabled = true;

    const name    = form.querySelector('[name="name"]')?.value.trim() || '';
    const phone   = form.querySelector('[name="phone"]')?.value.trim() || '';
    const service = form.querySelector('[name="service"]')?.value || '';
    const message = form.querySelector('[name="message"]')?.value.trim() || '';

    Promise.all([
      sendToTelegram(name, phone, service, message),
      sendEmail(name, phone, service, message),
    ])
      .then(() => {
        const formWrap = form.closest('.np-form-wrap');
        const thanks = formWrap?.querySelector('.np-thanks');
        form.style.display = 'none';
        if (thanks) thanks.classList.add('show');
      })
      .catch(() => {
        submitBtn.textContent = origText;
        submitBtn.disabled = false;
        alert('Не удалось отправить заявку. Позвоните нам или напишите на neonproik@mail.ru');
      });
  });

  /* Clear error on input */
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.classList.remove('error');
      const err = field.closest('.np-form-group')?.querySelector('.np-form-error');
      if (err) err.classList.remove('show');
    });
  });
}

/* Lightbox */
const lightbox = document.querySelector('.np-lightbox');
const lbImg = document.querySelector('.np-lightbox-img');
let lbItems = [];
let lbIndex = 0;

function lbOpen(items, idx) {
  lbItems = items;
  lbIndex = idx;
  lbImg.src = items[idx];
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function lbClose() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
function lbNav(dir) {
  lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
  lbImg.src = lbItems[lbIndex];
}

if (lightbox) {
  document.querySelector('.np-lightbox-close')?.addEventListener('click', lbClose);
  document.querySelector('.np-lightbox-prev')?.addEventListener('click', () => lbNav(-1));
  document.querySelector('.np-lightbox-next')?.addEventListener('click', () => lbNav(1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lbClose(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
  });
}

/* Init lightbox on portfolio items */
function initPortfolio() {
  const items = Array.from(document.querySelectorAll('.np-port-item[data-src]'));
  const srcs = items.map(i => i.dataset.src);
  items.forEach((item, idx) => {
    item.addEventListener('click', () => lbOpen(srcs, idx));
  });
}
initPortfolio();

/* Portfolio filters */
document.querySelectorAll('.np-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.np-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.np-port-item').forEach(item => {
      const match = filter === 'all' || item.dataset.cat === filter;
      item.style.display = match ? '' : 'none';
    });
  });
});
