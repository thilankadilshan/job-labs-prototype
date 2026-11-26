import glob, re
tot0=tot1=0
for f in glob.glob('/home/claude/proto_new/public/ats/**/index.html', recursive=True):
    s=open(f,encoding='utf-8').read(); tot0+=len(s)
    out=[]; inside=0
    for line in s.split('\n'):
        low=line.lower()
        if inside==0:
            l=line.strip()
            if l=='' : continue
            out.append(l)
        else:
            out.append(line)
        inside += len(re.findall(r'<(textarea|pre)\b', low)) - len(re.findall(r'</(textarea|pre)>', low))
        if inside<0: inside=0
    n='\n'.join(out); tot1+=len(n)
    open(f,'w',encoding='utf-8').write(n)
print(tot0//1024//1024,'MB ->',tot1//1024//1024,'MB')
