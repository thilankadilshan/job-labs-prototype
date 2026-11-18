#!/usr/bin/env python3
"""One-off converter: Laravel Blade views -> Nunjucks templates (for the static prototype).
Mechanical parts (layout sections, stacks, includes, asset/url/route helpers) are converted
automatically; data-driven expressions are converted with simple PHP->Nunjucks rules and
then hand-checked."""
import re, sys, os, json
from urllib.parse import quote_plus

VIEWS = sys.argv[1]           # .../resources/views
OUT = sys.argv[2]             # .../src

ROUTES = {
    'jobs.index': '/', 'jobs.slhome': '/employer', 'jobs.candidate-aboutus': '/about-us',
    'jobs.services': '/services', 'jobs.contact': '/contact', 'jobs.faq': '/faq',
    'jobs.privacy-policy': '/privacy-policy', 'jobs.terms-of-service': '/terms-of-service',
    'jobs.cookie-policy': '/cookie-policy', 'signup': '/recruiters-signup', 'login': '/ats',
    'contact.submit': '/contact/submit', 'job.useraccountrequest': '/user/request',
    'otp.verify.submit': '/signup/verify-otp', 'otp.resend': '/signup/resend-otp',
    'password.request': '/password/reset', 'cv.builder': '/cv-builder',
    'jobs.cookie.preferences.save': '/cookie-preferences', 'jobs.recommendations': '/recommendations',
    'signup.thankyou': '/signup/thankyou', 'candidate.auth': '/candidate/auth',
}
KEEP_INCLUDES = {
    'pages.front.hrportal.sections.header': 'partials/header.njk',
    'pages.front.hrportal.sections.footer': 'partials/footer.njk',
    'pages.front.hrportal.sections.top-bar': 'partials/top-bar.njk',
    'pages.front.sl-jobs.partials.vacancy-summary-table': 'partials/vacancy-summary-table.njk',
}

def view_path(name):
    return os.path.join(VIEWS, *name.split('.')) + '.blade.php'

def php_str(s):
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in '\'"' and not re.search(r'(?<!\\)' + s[0], s[1:-1]):
        return s[1:-1].replace("\\'", "'").replace('\\"', '"')
    return None

def split_top(e, ch):
    """Index of first top-level `ch` (outside quotes/parens), or -1."""
    d, q = 0, None
    for i, c in enumerate(e):
        if q:
            if c == q and e[i-1] != '\\': q = None
            continue
        if c in '\'"': q = c
        elif c in '([': d += 1
        elif c in ')]': d -= 1
        elif c == ch and d == 0:
            if ch == '?' and e[i+1:i+2] == '?': return -2  # '??'
            return i
    return -1

def php_expr(e):
    """Very small PHP -> Nunjucks expression translator."""
    e = e.strip()
    lit = php_str(e)
    if lit is not None:
        return json.dumps(lit)
    R = [
        (r"Str::limit\(trim\(preg_replace.*?\$job->job_adv_description\)\)\), ENT_QUOTES, 'UTF-8'\)\)\), (\d+)\)", r'(job.job_adv_description | plainText | limitStr(\1))'),
        (r'Str::limit\(strip_tags\(([^()]*)\),\s*(\d+)\)', r'(\1 | plainText | limitStr(\2))'),
        (r'Str::lower\((.*)\)$', r'((\1) | lower)'),
        (r"\$stats\['(\w+)'\]", r'stats.\1'),
        (r"->take\(3\)", " | first3"),
        (r"->implode\('([^']*)'\)", r" | join('\1')"),
        (r'\\?Carbon\\Carbon::parse\(([^()]*)\)->format\(\'M d, Y\'\)', r'(\1 | fmtDate)'),
        (r'\\?Carbon\\Carbon::parse\(([^()]*)\)->diffForHumans\(\)', r'(\1 | diffForHumans)'),
        (r'\\?App\\CompanyModel::profileUrl\(\$job->company_id,\s*\$job->company_name\)', r'(job | companyUrl)'),
        (r"route\('jobs.show',\s*\[\$job->job_refno,\s*Str::slug\(\$job->job_title\)\]\)", r'(job | jobUrl)'),
        (r"route\('jobs.apply.submit',\s*\[\$job->job_id,\s*Str::slug\(\$job->job_title\)\]\)", r"((job | jobUrl) ~ '/apply')"),
        (r'Str::limit\(([^,]*),\s*(\d+)\)', r'(\1 | limitStr(\2))'),
        (r'Str::slug\(([^()]*)\)', r'(\1 | slug)'),
        (r"Str::plural\(('\w[\w ]*'),\s*([^()]*)\)", r'(\1 | plural(\2))'),
        (r'number_format\(([^()]*)\)', r'(\1 | numberFormat)'),
        (r"asset\('/upload/' \. ([^()]*)\)", r"('/upload/' ~ \1)"),
        (r'request\(\)->fullUrl\(\)', r'(site.url ~ page.url)'),
        (r"(request|old|session)\('[\w.]+'\)", "''"),
        (r'->count\(\)', ' | length'),
    ]
    for a, b in R:
        e = re.sub(a, b, e)
    e = re.sub(r'urlencode\((.*)\)$', r'(\1) | urlencode', e)
    # ternary a ? b : c  ->  (b if a else c)
    qi = split_top(e, '?')
    if qi >= 0:
        rest = e[qi+1:]
        ci = split_top(rest, ':')
        if ci >= 0:
            return '(%s if %s else %s)' % (php_expr(rest[:ci]), php_expr(e[:qi]), php_expr(rest[ci+1:]))
    # PHP string concat ' . ' -> ' ~ '
    out, q = [], None
    for i, c in enumerate(e):
        if q:
            if c == q and e[i-1] != '\\': q = None
        elif c in '\'"': q = c
        elif c == '.' and e[i-1:i] == ' ' and e[i+1:i+2] == ' ':
            c = '~'
        out.append(c)
    e = ''.join(out)
    e = re.sub(r'\$(\w+)->(\w+)', r'\1.\2', e)
    e = re.sub(r'\$(\w+)\[\'(\w+)\'\]', r'\1.\2', e)
    e = re.sub(r'\$(\w+)', r'\1', e)
    e = e.replace('&&', ' and ').replace('||', ' or ').replace('??', ' or ')
    e = re.sub(r'!empty\(([^()]*)\)', r'\1', e)
    e = re.sub(r'(?<![=!<>])!(?!=)', ' not ', e)
    e = e.replace('===', '==').replace('!==', '!=')
    return e

def helper(expr):
    """Translate a {{ }} expression. Returns output text (literal or njk)."""
    x = expr.strip()
    m = re.fullmatch(r'asset\(\s*([\'"])/?(.*?)\1\s*\)', x)
    if m: return '/' + m.group(2)
    m = re.fullmatch(r'url\(\s*([\'"])(.*?)\1\s*\)', x)
    if m: return m.group(2) if m.group(2).startswith('/') else '/' + m.group(2)
    m = re.fullmatch(r'route\(\s*([\'"])([\w.\-]+)\1\s*\)', x)
    if m and m.group(2) in ROUTES: return ROUTES[m.group(2)]
    m = re.fullmatch(r'route\(\s*\'jobs.index\'\s*,\s*\[\s*\'(\w+)\'\s*=>\s*\'(\w+)\'\s*\]\s*\)', x)
    if m: return '/?%s=%s' % (m.group(1), m.group(2))
    m = re.fullmatch(r'urlencode\(\s*([\'"])(.*?)\1\s*\)', x, re.S)
    if m: return quote_plus(m.group(2).replace("\\'", "'"))
    if x == "date('Y')": return '{{ site.year }}'
    if x == 'csrf_token()': return 'prototype-csrf-token'
    if re.fullmatch(r'(request|old)\(\s*\'[\w.]+\'\s*\)', x): return ''
    if re.fullmatch(r"session\('\w+'\)", x): return ''
    if x in ('url()->current()',): return '{{ site.url }}{{ page.url }}'
    return '{{ ' + php_expr(x) + ' }}'

def convert_text(s, stacks, depth=0):
    s = re.sub(r'\{\{--.*?--\}\}', '', s, flags=re.S)
    # @include
    def inc(m):
        name = m.group(2)
        if name in KEEP_INCLUDES:
            return '{%% include "%s" %%}' % KEEP_INCLUDES[name]
        p = view_path(name)
        if not os.path.exists(p):
            return '<!-- missing include %s -->' % name
        return convert_partial(open(p, encoding='utf-8').read(), stacks, depth + 1)
    s = re.sub(r'@include\(\s*([\'"])([\w.\-]+)\1\s*(?:,\s*\[[^\]]*\])?\s*\)', inc, s)
    # @push inside partials
    def push(m):
        stacks.setdefault(m.group(2), []).append(m.group(3))
        return ''
    s = re.sub(r'@push\(\s*([\'"])([\w\-]+)\1\s*\)(.*?)@endpush', push, s, flags=re.S)
    s = re.sub(r'@csrf\b', '<input type="hidden" name="_token" value="prototype-csrf-token">', s)
    # raw/escaped echo
    s = re.sub(r'\{!!(.*?)!!\}', lambda m: '{{ ' + php_expr(m.group(1)) + ' | safe }}', s, flags=re.S)
    s = re.sub(r'(?<!@)\{\{(.*?)\}\}', lambda m: helper(m.group(1)), s, flags=re.S)
    # control structures (balanced-paren condition)
    out, i = [], 0
    pat = re.compile(r'@(if|elseif|foreach|forelse|isset|error)\s*\(')
    while True:
        m = pat.search(s, i)
        if not m:
            out.append(s[i:]); break
        out.append(s[i:m.start()])
        j, d = m.end(), 1
        while d and j < len(s):
            d += {'(': 1, ')': -1}.get(s[j], 0); j += 1
        cond = s[m.end():j - 1]
        kw = m.group(1)
        if kw == 'if': out.append('{% if ' + php_expr(cond) + ' %}')
        elif kw == 'elseif': out.append('{% elif ' + php_expr(cond) + ' %}')
        elif kw == 'isset': out.append('{% if ' + php_expr(cond) + ' %}')
        elif kw == 'error': out.append('{% if false %}')
        else:
            mm = re.fullmatch(r'\s*\$?(.+?)\s+as\s+\$(\w+)\s*', cond)
            out.append('{%% for %s in %s %%}' % (mm.group(2), php_expr(mm.group(1))) if mm else '{# TODO foreach(%s) #}' % cond)
        i = j
    s = ''.join(out)
    for a, b in [(r'@else\b', '{% else %}'), (r'@endif\b', '{% endif %}'), (r'@endisset\b', '{% endif %}'),
                 (r'@enderror\b', '{% endif %}'), (r'@endforeach\b', '{% endfor %}'),
                 (r'@empty\b(?!\()', '{% else %}'), (r'@endforelse\b', '{% endfor %}')]:
        s = re.sub(a, b, s)
    s = re.sub(r'@php(.*?)@endphp', lambda m: '{# TODO php:\n' + m.group(1).replace('#}', '# }') + '\n#}', s, flags=re.S)
    return s

def convert_partial(src, stacks, depth=0):
    return convert_text(src, stacks, depth)

def convert_page(view_name, permalink, out_rel, extra_front=''):
    src = open(view_path(view_name), encoding='utf-8').read()
    src = re.sub(r'\{\{--.*?--\}\}', '', src, flags=re.S)
    meta = {}
    for m in re.finditer(r"@section\(\s*'(\w+)'\s*,\s*((?:'(?:[^'\\]|\\.)*')|[^\n]*?)\)\s*\n", src):
        meta[m.group(1)] = m.group(2)
    stacks = {}
    def grab(m):
        stacks.setdefault(m.group(2), []).append(m.group(3)); return ''
    body = re.sub(r'@push\(\s*([\'"])([\w\-]+)\1\s*\)(.*?)@endpush', grab, src, flags=re.S)
    cm = re.search(r"@section\(\s*'content'\s*\)(.*?)@endsection", body, re.S)
    content = cm.group(1) if cm else ''
    content = convert_text(content, stacks)
    styles = convert_text(''.join(stacks.get('styles', [])), {})
    scripts = convert_text(''.join(stacks.get('scripts', []) + stacks.get('custom-scripts', [])), {})
    def metaval(k):
        if k not in meta: return None
        lit = php_str(meta[k])
        return lit if lit is not None else '{{ ' + php_expr(meta[k]) + ' }}'
    parts = ['---', 'permalink: "%s"' % permalink]
    if extra_front: parts.append(extra_front.strip())
    parts += ['---', '{% extends "layouts/master.njk" %}']
    for k in ('title', 'description', 'keywords', 'og_image'):
        v = metaval(k)
        if v is not None:
            parts.append('{%% block %s %%}%s{%% endblock %%}' % (k, v))
    parts.append('{% block styles %}' + styles + '{% endblock %}')
    parts.append('{% block content %}' + content + '{% endblock %}')
    parts.append('{% block scripts %}' + scripts + '{% endblock %}')
    path = os.path.join(OUT, out_rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write('\n'.join(parts) + '\n')
    print('page', out_rel)

def convert_include(view_name, out_rel):
    src = open(view_path(view_name), encoding='utf-8').read()
    stacks = {}
    txt = convert_text(src, stacks)
    path = os.path.join(OUT, '_includes', out_rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(txt)
    print('include', out_rel, 'stacks:', list(stacks))

if __name__ == '__main__':
    for v, o in KEEP_INCLUDES.items():
        convert_include(v, o)
    P = 'pages.front.sl-jobs.'
    for v, perm, o in [
        (P + 'sl-job-board', '/', 'index.njk'),
        (P + 'sl-landing-page', '/employer/', 'employer.njk'),
        (P + 'candidate-about-us', '/about-us/', 'about-us.njk'),
        (P + 'services', '/services/', 'services.njk'),
        (P + 'contact', '/contact/', 'contact.njk'),
        (P + 'faq', '/faq/', 'faq.njk'),
        (P + 'privacy-policy', '/privacy-policy/', 'privacy-policy.njk'),
        (P + 'terms-of-service', '/terms-of-service/', 'terms-of-service.njk'),
        (P + 'cookie-policy', '/cookie-policy/', 'cookie-policy.njk'),
        (P + 'cv-builder', '/cv-builder/', 'cv-builder.njk'),
        (P + 'job-details', '/{{ job.job_refno }}/{{ job.slug }}/', 'job-details.njk'),
        (P + 'job-application', '/{{ job.job_refno }}/{{ job.slug }}/apply/', 'job-application.njk'),
        (P + 'company-profile', '/company/{{ company.company_id }}/{{ company.slug }}/', 'company-profile.njk'),
        ('pages.front.hrportal.signup', '/recruiters-signup/', 'recruiters-signup.njk'),
        ('pages.front.hrportal.otp_verify', '/signup/verify-otp/', 'signup-verify-otp.njk'),
        ('pages.front.hrportal.thankyou', '/signup/thankyou/', 'signup-thankyou.njk'),
    ]:
        convert_page(v, perm, o)
