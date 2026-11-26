import json, re, os, html, shutil
from urllib.parse import urlsplit, parse_qs
OUT='/home/claude/proto_new/public'
shutil.rmtree(OUT+'/ats', ignore_errors=True)
ROLES={'superadmin':'Super Admin','account-manager':'Account Manager','hiring-manager':'Hiring Manager'}
PUBLIC_RE=re.compile(r'^/($|JBS\d+|company/\d+|login|employer|about-us|services|contact|faq|privacy-policy|terms|cookie-policy|recruiters-signup|signup|cv-builder|jobs|job-board)')
ASSET_RE=re.compile(r'^/(assets|css|js|images|fonts|upload|uploads|favicon|storage|vendor|plugins)/', re.I)
assets=set()
def norm(u):
    s=urlsplit(u); path=(s.path.rstrip('/') or '/'); q=parse_qs(s.query)
    page=q['page'][0] if set(q.keys())=={'page'} and q['page'][0].isdigit() else None
    return path, page, s.fragment
def key(path,page): return path+('?page='+page if page and page!='1' else '')
def outpath(k):
    if '?page=' in k: p,n=k.split('?page='); return p+'/page-'+n
    return k
lookups=json.load(open('/home/claude/ats_out/lookups.json'))
for role,label in ROLES.items():
    pages=json.load(open(f'/home/claude/ats_out/{role}/pages.json'))
    xhr=json.load(open(f'/home/claude/ats_out/{role}/xhr.json'))
    base='/ats/'+role
    saved=set(pages.keys())
    def map_href(v):
        raw=v
        v=html.unescape(v)
        if v.startswith('http://127.0.0.1:8099'): v=v[len('http://127.0.0.1:8099'):] or '/'
        if not v or v.startswith(('#','javascript:','mailto:','tel:','data:','http://','https://','//')): return None
        if not v.startswith('/'): return None
        path,page,frag=norm(v)
        if ASSET_RE.match(path): assets.add(path); return ('keep', path)
        if path=='/logout': return ('keep','/login')
        if PUBLIC_RE.match(path): return ('keep', v)
        k=key(path,page)
        if k in saved: return ('keep', base+outpath(k)+(('#'+frag) if frag else ''))
        if path in saved: return ('keep', base+path)
        return ('mock', path)
    for k,doc in pages.items():
        doc=doc.replace('http://127.0.0.1:8099','')
        def rep_href(m):
            attr,q,val=m.group(1),m.group(2),m.group(3)
            r=map_href(val)
            if r is None: return m.group(0)
            if r[0]=='keep': return f'{attr}={q}{r[1]}{q}'
            return f'{attr}={q}#{q} data-mock-href={q}{html.escape(r[1])}{q}'
        doc=re.sub(r'\b(href)=(["\'])([^"\']*)\2', rep_href, doc)
        def rep_src(m):
            val=m.group(3)
            if val.startswith('/') and not val.startswith('//'):
                p=urlsplit(html.unescape(val)).path
                if ASSET_RE.match(p) or p.startswith('/'): assets.add(p)
            return m.group(0)
        doc=re.sub(r'\b(src)=(["\'])([^"\']*)\2', rep_src, doc)
        def rep_action(m):
            q,val=m.group(1),m.group(2)
            return f'action={q}#{q} data-mock-action={q}{val}{q}'
        doc=re.sub(r'\baction=(["\'])([^"\']*)\1', rep_action, doc)
        doc=re.sub(r'<!--\s*Google tag[^>]*-->\s*','',doc)
        doc=re.sub(r'<script[^>]*googletagmanager\.com/gtag[^>]*>\s*</script>\s*<script>[\s\S]*?gtag\([\'"]config[\s\S]*?</script>','',doc)
        doc=re.sub(r'<script[^>]*?(?:\n[^>]*?)*?adsbygoogle\.js[^>]*>\s*</script>','',doc)
        doc=re.sub(r'<meta name="google-site-verification"[^>]*>','',doc)
        inject=(f'<meta name="robots" content="noindex, nofollow">'
                f'<script>window.__ATS_ROLE={json.dumps(role)};window.__ATS_ROLE_LABEL={json.dumps(label)};window.__ATS_BASE={json.dumps(base)};</script>'
                f'<script src="/js/ats-mock-data-{role}.js"></script><script src="/js/ats-mock.js"></script>')
        doc=re.sub(r'(<head[^>]*>)', lambda m: m.group(1)+inject, doc, count=1, flags=re.I)
        dest=OUT+base+outpath(k)+'/index.html'
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest,'w',encoding='utf-8').write(doc)
        # draft preview page (unsaved form preview) based on the first saved preview
    prev=sorted([k for k in pages if k.startswith('/admin/job/preview/')])
    src_prev = OUT+base+prev[0]+'/index.html' if prev else None
    if not src_prev:
        # hiring manager has no saved preview page: borrow from superadmin output later
        src_prev = None
    rec={}
    for kk,v in xhr.items():
        rec[kk]={'status':v['status'],'ct':v['ct'],'body':v['body']}
    os.makedirs(OUT+'/js',exist_ok=True)
    open(f'{OUT}/js/ats-mock-data-{role}.js','w').write('window.__ATS_XHR='+json.dumps(rec)+';window.__ATS_LOOKUPS='+json.dumps(lookups)+';')
    print(role, len(pages), 'pages')
json.dump(sorted(assets), open('/home/claude/ats_out/assets.json','w'))
print('assets', len(assets))

# ---- unsaved-form preview page (/admin/job/preview/draft) for every role
FILL = r'''<script>
document.addEventListener('DOMContentLoaded', function () {
  var d = {}; try { d = JSON.parse(sessionStorage.getItem('jl_preview_draft') || '{}'); } catch (e) {}
  if (!d || !Object.keys(d).length) return;
  var set = function (sel, val, asHtml) { var el = document.querySelector(sel); if (el && val) { if (asHtml) el.innerHTML = val; else el.textContent = val; } };
  var oldTitle = (document.querySelector('#jobTitle') || {}).textContent || '';
  if (d.title) {
    set('#jobTitle', d.title); document.title = d.title + ' - Job Labs (Preview)';
    document.querySelectorAll('body *').forEach(function (el) { if (el.children.length === 0 && el.textContent.trim() === oldTitle.trim() && el.id !== 'jobTitle') el.textContent = d.title; });
  }
  var descs = document.querySelectorAll('.job-description');
  if (descs[0] && d.jobdesc && d.jobdesc !== '<p><br></p>') descs[0].innerHTML = d.jobdesc;
  set('#sec-requirements .job-description', d.jobkeyword && d.jobkeyword !== '<p><br></p>' ? d.jobkeyword : '', true);
  set('#sec-benefits .job-description', d.jobbenifits && d.jobbenifits !== '<p><br></p>' ? d.jobbenifits : '', true);
  document.querySelectorAll('.salary-highlight').forEach(function (el) { el.textContent = d.salary ? 'LKR ' + d.salary : 'Salary Negotiable'; });
  if (d.vacancyrefno) document.querySelectorAll('.job-info-table tr:first-child td:last-child').forEach(function (el) { el.textContent = d.vacancyrefno; });
});
</script>'''
sa_prev = OUT + '/ats/superadmin/admin/job/preview/1008/index.html'
tmpl = open(sa_prev, encoding='utf-8').read()
for role, label in ROLES.items():
    doc = tmpl.replace('/ats/superadmin', '/ats/' + role).replace('"superadmin"', json.dumps(role)).replace('"Super Admin"', json.dumps(label)).replace('ats-mock-data-superadmin.js', f'ats-mock-data-{role}.js')
    doc = doc.replace('</body>', FILL + '</body>', 1)
    dest = OUT + f'/ats/{role}/admin/job/preview/draft/index.html'
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(doc)
print('draft previews written')
