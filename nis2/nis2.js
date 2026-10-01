/* Clarified IT · pagina NIS2: meniu, bară fixă pe mobil, apariție la derulare, formular cu atribuire. */
(function clarifiedNis2(document, window) {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function track(category, eventName, parameters) {
    if (typeof window.clarifiedTrack === 'function') window.clarifiedTrack(category, eventName, parameters);
  }

  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var links = document.getElementById('nav-links');
    if (!toggle || !links) return;
    function close() {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });
  }

  function setupSticky() {
    var bar = document.getElementById('nis2-sticky');
    var target = document.getElementById('solicitare');
    if (!bar || !target) return;
    function update() {
      var rect = target.getBoundingClientRect();
      var formInView = rect.top < window.innerHeight - 80 && rect.bottom > 0;
      bar.classList.toggle('is-visible', window.scrollY > 520 && !formInView);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function setupReveal() {
    var items = document.querySelectorAll('.nis2-head, .nis2-card, .nis2-timeline li, .nis2-figures, .nis2-stakes article, .nis2-step, .nis2-points li, .nis2-faq, .nis2-request-copy, .nis2-form-card');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduced) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(items, function (item) {
      /* Ce este deja în ecran rămâne vizibil, ca să nu clipească la încărcare. */
      if (item.getBoundingClientRect().top < window.innerHeight) return;
      item.classList.add('nis2-reveal');
      observer.observe(item);
    });
  }

  function setupForm() {
    var form = document.getElementById('nis2-form');
    var status = document.getElementById('nis2-form-status');
    if (!form || !status) return;
    var submitButton = form.querySelector('button[type="submit"]');
    var originalButtonText = submitButton ? submitButton.textContent : '';
    var params = new URLSearchParams(window.location.search);
    var service = 'Evaluarea incadrarii NIS2';

    function clean(value, limit) {
      return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit || 240);
    }

    function setField(name, value) {
      var field = form.elements.namedItem(name);
      if (field) field.value = clean(value, name === 'landing_page' || name === 'referrer' ? 1000 : 240);
    }

    function populateAttribution() {
      setField('lead_source', params.get('source') || document.referrer || 'Acces direct');
      setField('landing_page', window.location.href);
      setField('referrer', document.referrer);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'li_fat_id'].forEach(function (key) {
        setField(key, params.get(key) || '');
      });
    }

    function show(message, type) {
      status.textContent = message;
      status.className = 'clarified-form-status ' + (type || '');
      status.style.display = message ? 'block' : '';
    }

    populateAttribution();

    form.addEventListener('focusin', function onFirstFocus() {
      track('analytics', 'clarified_it_form_start', { service: service, page_path: window.location.pathname });
      form.removeEventListener('focusin', onFirstFocus);
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var privacy = form.elements.namedItem('privacy_acknowledged');
      if (!privacy || !privacy.checked) {
        show('Confirmă mai întâi că ai citit politica de confidențialitate.', 'error');
        if (privacy) privacy.focus();
        return;
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Se trimite…';
      }
      show('Se trimite solicitarea…', '');
      track('analytics', 'clarified_it_form_submit', { service: service, page_path: window.location.pathname });
      try {
        var response = await window.fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Form endpoint rejected the request');
        show('Mulțumim. Solicitarea a ajuns la echipa Clarified IT. Revenim cu întrebările de clarificare.', 'success');
        track('analytics', 'clarified_it_form_success', { service: service, page_path: window.location.pathname });
        track('marketing', 'clarified_it_lead', { service: service, page_path: window.location.pathname });
        form.reset();
        populateAttribution();
      } catch (_) {
        show('Mesajul nu a putut fi trimis. Scrie-ne direct la office@clarified.ro sau sună la +40 774 456 127.', 'error');
        track('analytics', 'clarified_it_form_error', { service: service, page_path: window.location.pathname });
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  }

  ready(function () {
    setupMenu();
    setupSticky();
    setupReveal();
    setupForm();
  });
})(document, window);
