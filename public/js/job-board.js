/*
 * Prototype stand-in for JobsBoardController@index.
 * The Laravel page filters + paginates on the server from the query string
 * (?search=&job_type=&job_sector=&work_type=&industry_sector=&city=&salary_range=&page=).
 * Here every mock job is rendered into two inert <template>s (search view / default view)
 * and this script — loaded synchronously right after them — picks the view, filters the
 * cards, slices the current page and inserts the result, before the page's own scripts run.
 */
(function () {
  var PER_PAGE = 10;
  var params = new URLSearchParams(window.location.search);
  var get = function (k) { return (params.get(k) || '').trim(); };

  // Any filter (hero Job Sector dropdown, sidebar filters, footer Industry Sector links) shows the results view
  var hasSearch = !!(get('search') || get('job_type') || get('job_sector') || get('work_type') || get('industry_sector') || get('city') || get('salary_range'));
  var hasFilters = ['search', 'job_type', 'job_sector', 'work_type', 'industry_sector', 'city', 'salary_range']
    .some(function (k) { return get(k) !== ''; });

  var tpl = document.getElementById(hasSearch ? 'protoSearchView' : 'protoDefaultView');
  if (!tpl) return;
  var view = tpl.content.cloneNode(true);

  // Featured (random) jobs are only shown when nothing is filtered
  if (hasFilters) {
    var featured = view.querySelector('#horizontalVacanciesSection');
    if (featured) featured.remove();
  }

  // MySQL-style numeric compare on strings like "50000-60000" (leading number)
  function salaryOk(raw, range) {
    if (!range) return true;
    var n = parseFloat(String(raw || '').replace(/,/g, '')) || 0;
    switch (range) {
      case '0-50000': return n <= 50000;
      case '50000-100000': return n >= 50000 && n <= 100000;
      case '100000-200000': return n >= 100000 && n <= 200000;
      case '200000+': return n >= 200000;
      default: return true;
    }
  }
  function matches(card) {
    var d = card.dataset;
    if (get('search') && d.search.indexOf(get('search').toLowerCase()) === -1) return false;
    if (get('job_type') && d.jobType !== get('job_type')) return false;
    if (get('job_sector') && d.jobSector !== get('job_sector')) return false;
    if (get('work_type') && d.workType !== get('work_type')) return false;
    if (get('industry_sector') && d.industrySector !== get('industry_sector')) return false;
    if (get('city') && d.city !== get('city')) return false;
    return salaryOk(d.salary, get('salary_range'));
  }

  // Only the main list cards (not the featured carousel, which uses .card-job-*)
  var cards = Array.prototype.slice.call(view.querySelectorAll('.job-card[data-job-id]'));
  var hits = cards.filter(matches);
  var lastPage = Math.max(1, Math.ceil(hits.length / PER_PAGE));
  var page = Math.min(Math.max(parseInt(get('page'), 10) || 1, 1), lastPage);
  var shown = hits.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  cards.forEach(function (c) { if (shown.indexOf(c) === -1) c.remove(); });

  if (hits.length === 0) {
    view.querySelectorAll('template.proto-no-jobs').forEach(function (t) {
      t.replaceWith(t.content.cloneNode(true));
    });
  }

  var total = view.querySelector('.proto-total');
  if (total) total.textContent = 'Showing ' + hits.length + ' Job Results';

  view.querySelectorAll('.custom-pagination').forEach(function (p) {
    if (lastPage <= 1) { p.closest('.pagination-container').remove(); return; }
    p.dataset.currentPage = page;
    p.dataset.lastPage = lastPage;
    p.dataset.pageUrl = window.location.pathname + window.location.search;
  });

  tpl.parentNode.insertBefore(view, tpl);

  // Re-select the submitted values in every search / filter form (Blade did this with request())
  document.querySelectorAll('form[action="/"]').forEach(function (form) {
    params.forEach(function (value, key) {
      var el = form.elements[key];
      if (el && 'value' in el && key !== 'page') el.value = value;
    });
  });
})();
