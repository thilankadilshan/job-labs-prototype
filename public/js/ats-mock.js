/*
 * Job Labs PROTOTYPE - fake back-end for the ATS / dashboard pages.
 *
 * The /ats/{role}/... pages are static snapshots of the real ATS, rendered from the
 * real Laravel views with mock data. This file (loaded first on every ATS page):
 *   - answers AJAX / fetch calls in the browser (recorded responses + a few lookups),
 *   - catches form submits ("Saved - prototype only") and sends you to the right page,
 *   - turns actions that are not part of the prototype into a friendly notice,
 *   - powers the vacancy "Preview" for unsaved Create / Edit forms.
 * Nothing is sent anywhere.
 */
(function () {
  'use strict';
  var ROLE = window.__ATS_ROLE || 'superadmin';
  var LABEL = window.__ATS_ROLE_LABEL || 'Super Admin';
  var BASE = window.__ATS_BASE || ('/ats/' + ROLE);
  var REC = window.__ATS_XHR || {};
  var LOOKUPS = window.__ATS_LOOKUPS || { sectors: {}, cities: {} };
  try { localStorage.setItem('jl_ats_role', ROLE); } catch (e) {}

  /* ---------------- toast ---------------- */
  function toast(msg, type) {
    var run = function () {
      var t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;' +
        'background:' + (type === 'info' ? '#1f2937' : '#065f46') + ';color:#fff;padding:12px 18px;border-radius:10px;' +
        'font:600 14px/1.4 Inter,Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:90vw;text-align:center';
      document.body.appendChild(t);
      setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 2400);
      setTimeout(function () { t.remove(); }, 2900);
    };
    if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
  }
  window.atsPrototypeToast = toast;

  /* ---------------- prototype badge ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('div');
    b.innerHTML = '<span style="opacity:.75">Prototype</span> &middot; <b>' + LABEL + '</b> &middot; ' +
      '<a href="/login" style="color:#fde68a;text-decoration:underline">Switch role</a>';
    b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483646;background:rgba(17,24,39,.92);color:#fff;' +
      'padding:7px 12px;border-radius:999px;font:500 12px/1.3 Inter,Arial,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)';
    document.body.appendChild(b);
  });

  /* ---------------- fake API ---------------- */
  var STATIC_RE = /\.(js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|eot|map|json|pdf)$/i;
  function isApi(u) {
    return u.origin === location.origin && !STATIC_RE.test(u.pathname);
  }
  function bodyParam(body, name) {
    try {
      if (!body) return null;
      if (typeof body === 'string') return new URLSearchParams(body).get(name);
      if (body.get) return body.get(name);
    } catch (e) {}
    return null;
  }
  function answer(method, u, body) {
    var p = u.pathname.indexOf(BASE) === 0 ? (u.pathname.slice(BASE.length) || '/') : u.pathname;
    if (/jobsector\/list$/.test(p)) return [200, JSON.stringify(LOOKUPS.sectors[bodyParam(body, 'label_parentId')] || [])];
    if (/cities-by-country$/.test(p)) return [200, JSON.stringify(LOOKUPS.cities || {})];
    var r = REC[method + ' ' + p + u.search] || REC[method + ' ' + p];
    if (r) return [r.status || 200, r.body, r.ct];
    if (method === 'GET') return [200, JSON.stringify({ success: true, data: [], count: 0 })];
    setTimeout(function () { toast('Saved ✓ — prototype only, nothing was stored'); }, 50);
    return [200, JSON.stringify({ success: true, status: 'success', message: 'Saved (prototype - nothing is stored).', data: [] })];
  }

  // fetch
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    try {
      var u = new URL(typeof input === 'string' ? input : input.url, location.href);
      var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      if (isApi(u)) {
        var a = answer(method, u, init && init.body);
        return new Promise(function (res) {
          setTimeout(function () { res(new Response(a[1], { status: a[0], headers: { 'Content-Type': a[2] || 'application/json' } })); }, 250);
        });
      }
    } catch (e) {}
    return realFetch(input, init);
  };

  // XMLHttpRequest (jQuery $.ajax)
  var XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    try { this.__mockU = new URL(url, location.href); this.__mockM = String(method || 'GET').toUpperCase(); } catch (e) { this.__mockU = null; }
    this.__mock = !!(this.__mockU && isApi(this.__mockU));
    if (!this.__mock) return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = (function (orig) {
    return function () { if (!this.__mock) return orig.apply(this, arguments); };
  })(XMLHttpRequest.prototype.setRequestHeader);
  XMLHttpRequest.prototype.send = function (body) {
    if (!this.__mock) return XS.apply(this, arguments);
    var xhr = this, a = answer(this.__mockM, this.__mockU, body);
    var def = function (k, v) { try { Object.defineProperty(xhr, k, { value: v, configurable: true }); } catch (e) {} };
    setTimeout(function () {
      var parsed = a[1];
      if (xhr.responseType === 'json') { try { parsed = JSON.parse(a[1]); } catch (e) { parsed = null; } }
      def('readyState', 4); def('status', a[0]); def('statusText', 'OK');
      def('responseText', a[1]); def('response', parsed); def('responseURL', xhr.__mockU.href);
      xhr.getAllResponseHeaders = function () { return 'content-type: ' + (a[2] || 'application/json') + '\r\n'; };
      xhr.getResponseHeader = function (h) { return /content-type/i.test(h) ? (a[2] || 'application/json') : null; };
      if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
      if (typeof xhr.onload === 'function') xhr.onload();
      try { xhr.dispatchEvent(new Event('readystatechange')); xhr.dispatchEvent(new Event('load')); xhr.dispatchEvent(new Event('loadend')); } catch (e) {}
    }, 250);
  };

  /* ---------------- forms ---------------- */
  function previewDraft(form) {
    var data = {};
    try { new FormData(form).forEach(function (v, k) { if (typeof v === 'string') data[k] = v; }); } catch (e) {}
    try { sessionStorage.setItem('jl_preview_draft', JSON.stringify(data)); } catch (e) {}
    window.open(BASE + '/admin/job/preview/draft', '_blank');
  }
  var REDIRECTS = [
    [/\/job\/(store|update)$/, '/admin/job/list'],
    [/\/job\/status\/update$|\/job\/admin\/update/, '/admin/job/admin/list'],
    [/\/company\//, '/admin/company/list'],
    [/\/user\//, '/admin/user/list'],
    [/\/category\//, '/admin/category/list'],
    [/\/roles?\//, '/admin/roles/index'],
    [/^\/leads/, '/leads'],
    [/my-tickets|support/, null]
  ];
  function handleForm(form, ev) {
    var act = form.getAttribute('data-mock-action') || form.getAttribute('action') || '';
    var path = '';
    try { path = new URL(act || location.href, location.href).pathname; } catch (e) {}
    if (/\/admin\/job\/preview$/.test(path)) { if (ev) ev.preventDefault(); previewDraft(form); return true; }
    if (!form.hasAttribute('data-mock-action') && path.indexOf('/ats/') === 0) return false; // real static link
    if (ev) ev.preventDefault();
    var method = (form.getAttribute('method') || 'get').toLowerCase();
    if (method === 'get') { toast('Search & filters are not active in the prototype', 'info'); return true; }
    toast('Saved ✓ — prototype only, nothing was stored');
    var next = undefined;
    for (var i = 0; i < REDIRECTS.length; i++) if (REDIRECTS[i][0].test(path)) { next = REDIRECTS[i][1]; break; }
    if (/apptracker|tracker\/update/.test(path)) next = 'back';
    setTimeout(function () {
      if (next === 'back') history.back();
      else if (next) location.href = BASE + next;
    }, 1100);
    return true;
  }
  document.addEventListener('submit', function (e) { handleForm(e.target, e); }, true);
  var realSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () { if (!handleForm(this, null)) realSubmit.call(this); };
  if (HTMLFormElement.prototype.requestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function () { var ev = new Event('submit', { cancelable: true, bubbles: true }); if (this.dispatchEvent(ev)) handleForm(this, null); };
  }

  /* ---------------- links ---------------- */
  var PUBLIC = /^\/($|JBS\d+|company\/\d+|login|employer|about-us|services|contact|faq|privacy-policy|terms|cookie-policy|recruiters-signup|signup|cv-builder|jobs|job-board|ats\/)/;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var mh = a.getAttribute('data-mock-href');
    if (mh) {
      e.preventDefault();
      var what = /delete|destroy/.test(mh) ? 'Delete' : /restore/.test(mh) ? 'Restore' : /export|download|print/.test(mh) ? 'Export / download' : null;
      toast(what ? what + ' is disabled in the prototype' : 'This page is not part of the prototype', 'info');
      return;
    }
    var href = a.getAttribute('href') || '';
    // links built by page scripts (e.g. "/admin/job/edit/12") -> same page inside this role's snapshot
    if (href.charAt(0) === '/' && href.indexOf('/ats/') !== 0 && !PUBLIC.test(href) && !STATIC_RE.test(href.split('?')[0])) {
      e.preventDefault();
      location.href = BASE + href.split('?')[0].replace(/\/$/, '');
    }
  }, true);
})();
