#!/usr/bin/env python3
"""Pure content QA for the Stage 3 handoff. No HTTP or repository mutations."""
import json,re,collections,itertools
from pathlib import Path
ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'CONTENT_MANIFEST.json').read_text(encoding='utf-8'))
entries=manifest['entries']
known={e['path'] for e in entries}
issues=[]
heads={}
links_total=0
n=[]
texts={}
for e in entries:
    if not e.get('proposal_file'):continue
    p=ROOT.parent.parent/e['proposal_file']
    try:t=p.read_text(encoding='utf-8')
    except OSError: issues.append(f'MISSING {p}'); continue
    texts[e['path']]=t
    m=re.findall(r'^## (.+)$',t,re.M)
    if len(m)!=1:issues.append(f'H2_COUNT {e["path"]}: {len(m)}')
    for h in m:heads.setdefault(h,[]).append(e['path'])
    links=re.findall(r'\[([^]]+)\]\((/[^)]+)\)',t)
    links_total+=len(links)
    n.append(len(t.split()))
    approved={x['target'] for x in e['matrix_candidates']}
    for anchor,path in links:
        if path not in known:issues.append(f'UNKNOWN_LINK {e["path"]} -> {path}')
        if path not in approved:issues.append(f'OUTSIDE_MATRIX {e["path"]} -> {path}')
        if path==e['path']:issues.append(f'SELF_LINK {e["path"]}')
        if len(anchor.strip())<5:issues.append(f'BAD_ANCHOR {e["path"]}')
    if len(links)!=len(set(path for _,path in links)):
        issues.append(f'REPEATED_TARGET_WITHIN_BLOCK {e["path"]}')
    if len(t.split()) < 100:
        issues.append(f'TOO_SHORT_FOR_PROPOSED_FULL_BLOCK {e["path"]}')
for h,p in heads.items():
    if len(p)>1:issues.append(f'DUPLICATE_H2 {h}: {p}')
for a,b in itertools.combinations(texts,2):
    def tok(txt):return set(re.findall(r'(?u)\b[\w’ʼ-]+\b',txt.lower()))
    aa=tok(texts[a]);bb=tok(texts[b]); sim=len(aa&bb)/max(1,len(aa|bb))
    if sim>.4: issues.append(f'HIGH_LEXICAL_OVERLAP {a} vs {b}: {sim:.3f}')
if len(entries)!=38:issues.append('INVENTORY_NOT_38')
if len(texts)!=31:issues.append('PROPOSAL_NOT_31')
print(f'pages={len(entries)} drafts={len(texts)} intentional_no_blocks={len(entries)-len(texts)} links={links_total} words={sum(n)}')
print('text_words_min_max=',(min(n),max(n)))
if issues:
    for err in issues:print('ERROR:',err)
    raise SystemExit(1)
print('PASS: unique H2, distinct drafts, local-route links, matrix membership, minimum useful detail')
print('NOT CHECKED: live page content, actual URL/canonical status, design, functionality, production tests, business evidence, implementation')
