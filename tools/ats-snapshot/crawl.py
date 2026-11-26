import os, re, json, sys, html
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright
sys.path.insert(0,'/home/claude')
src=open('/home/claude/resp.py').read().split("JS='''")[0]
exec(src)  # gives handler() for CDN mapping
BASE='http://127.0.0.1:8099'
ROLES={'superadmin':1,'account-manager':2,'hiring-manager':3}
OUT='/home/claude/ats_out'
PUBLIC_RE=re.compile(r'^/($|JBS\d+|company/\d+|login|logout|employer|about-us|services|contact|faq|privacy-policy|terms|cookie-policy|recruiters-signup|signup|cv-builder|career|careers|jobs|job-board|candidate|storage/|upload|assets|css|js|images|fonts|favicon)')
SKIP_RE=re.compile(r'(delete|destroy|restore|logout|clear-cache|fix-config|make-storage-link|test-brevo|zoom/|stripe|session/|/export|download|\.pdf$|\.csv$|\.xlsx?$|/unread-count|ticket-counts|/archive/|mark-|/toggle|fake-views|payment/create|/print)', re.I)
def norm(u):
    if not u or u.startswith(('javascript:','mailto:','tel:','#','data:')): return None
    s=urlsplit(u)
    if s.netloc and s.netloc!='127.0.0.1:8099': return None
    path=s.path or '/'
    if not path.startswith('/'): return None
    q=parse_qs(s.query)
    page=None
    if set(q.keys())=={'page'}:
        page=q['page'][0]
        if not page.isdigit(): page=None
    if path.rstrip('/')=='' : path='/'
    return path.rstrip('/') or '/', page
def key(path,page): return path+('?page='+page if page and page!='1' else '')
ALLOWED_JOBS=set('1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,2000,2001,2002,2003,2004,2005,2006,2007,2008,2010'.split(','))
JOB_PAGE_RE=re.compile(r'^/admin/(job/edit|job/admin/edit|job/preview|application/tracker/list)/(\d+)$')
def allowed(lp, parent):
    m=JOB_PAGE_RE.match(lp)
    if m and m.group(2) not in ALLOWED_JOBS: return False
    return True
roles = sys.argv[1].split(',') if len(sys.argv)>1 else list(ROLES)
with sync_playwright() as p:
    b=p.chromium.launch()
    for role in roles:
        uid=ROLES[role]
        ctx=b.new_context(viewport={'width':1366,'height':900})
        pg=ctx.new_page(); pg.route('**/*', handler)
        xhr={}
        def on_resp(r):
            req=r.request
            if req.resource_type in ('xhr','fetch') and r.url.startswith(BASE):
                s=urlsplit(r.url)
                try: body=r.text()
                except Exception: body=''
                k=req.method+' '+s.path+(('?'+s.query) if s.query else '')
                xhr.setdefault(k, {'status':r.status,'ct':r.headers.get('content-type',''),'body':body,'post':req.post_data or ''})
        pg.on('response', on_resp)
        pg.goto(BASE+'/__t/x/login/%d'%uid, wait_until='domcontentloaded')
        queue=[('/dashboard',None)]; seen=set(); saved={}
        while queue and len(saved)<700:
            path,page=queue.pop(0); k=key(path,page)
            if k in seen: continue
            seen.add(k)
            url=BASE+path+(('?page='+page) if page else '')
            try:
                resp=pg.goto(url, wait_until='domcontentloaded', timeout=30000)
                try: pg.wait_for_load_state('networkidle', timeout=6000)
                except Exception: pass
            except Exception as e:
                print(role,'ERR',k,str(e)[:80]); continue
            if not resp or resp.status!=200 or 'text/html' not in (resp.headers.get('content-type','')):
                print(role,'skip',k,resp.status if resp else None); continue
            if urlsplit(pg.url).path.rstrip('/') != path.rstrip('/') and path!='/dashboard':
                print(role,'redirected',k,'->',urlsplit(pg.url).path); continue
            raw=resp.text()
            saved[k]=raw
            links=list(dict.fromkeys(re.findall(r'href=["\']([^"\']+)["\']', raw)))
            try: links += [x for x in pg.eval_on_selector_all('a[href]','els=>els.map(e=>e.getAttribute("href"))') if x not in links]
            except Exception: pass
            edits=0
            for l in links:
                l=html.unescape(l)
                n=norm(l)
                if not n: continue
                lp,lpage=n
                if PUBLIC_RE.match(lp) or SKIP_RE.search(lp) or not allowed(lp, path): continue
                if lp.startswith('/admin/application/tracker/edit/'):
                    if not path.startswith('/admin/application/tracker/list/') or edits>=3 or key(lp,lpage) in seen: continue
                    edits+=1
                if key(lp,lpage) not in seen: queue.append((lp,lpage))
        os.makedirs(f'{OUT}/{role}',exist_ok=True)
        json.dump(saved, open(f'{OUT}/{role}/pages.json','w'))
        json.dump(xhr, open(f'{OUT}/{role}/xhr.json','w'))
        print(role,'saved',len(saved),'xhr',len(xhr))
        ctx.close()
    b.close()
