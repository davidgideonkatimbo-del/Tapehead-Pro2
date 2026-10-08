from pathlib import Path
import re, zipfile, shutil, os
from bs4 import BeautifulSoup

root=Path('/mnt/data/tapehead_beat_layout')
p=root/'www/index.html'
s=p.read_text(encoding='utf-8')

# Add clear section framing without removing any existing controls.
s=s.replace('<section class="view" id="view-beat" hidden>\n', '''<section class="view" id="view-beat" hidden>\n<div class="beat-section-heading"><span>01</span><div><b>Beat Setup</b><small>Tempo, groove and quick starting point</small></div></div>\n''',1)
s=s.replace('<div class="mixer">\n', '''<div class="beat-section-heading beat-section-heading-tight"><span>02</span><div><b>Pattern &amp; Sounds</b><small>Build the rhythm, choose your kit, then shape each hit</small></div></div>\n<div class="mixer">\n''',1)
# Label the sound area before genre kit.
s=s.replace('<div class="mix-head" style="border-bottom:none;padding-bottom:0">\n<span class="card-h-title" style="color:#8A8680">Genre kit</span>', '''<div class="beat-subsection-label"><b>Sound Kit</b><span>Genre presets &amp; your own samples</span></div>\n<div class="mix-head beat-sound-select" style="border-bottom:none;padding-bottom:0">\n<span class="card-h-title" style="color:#8A8680">Genre kit</span>''',1)
# Add a Beat Lab section heading immediately before premium lab.
s=s.replace('<div class="th-premium" id="beatPremiumLab">\n', '''<div class="beat-section-heading beat-section-heading-tight beat-lab-heading"><span>03</span><div><b>Beat Lab Pro</b><small>Advanced groove, AI, fills, bass, character and drum FX</small></div></div>\n<div class="th-premium" id="beatPremiumLab">\n''',1)

# Convert each Beat Lab card to a details accordion while retaining all controls/IDs.
start=s.index('<div class="th-premium-grid">')
end=s.index('</div>\n</div>\n</div>\n</section>', start)  # closes grid, premium, mixer
frag=s[start:end]
soup=BeautifulSoup(frag, 'html.parser')
grid=soup.select_one('.th-premium-grid')
for card in list(grid.find_all(class_='th-pro-card', recursive=False)):
    title=card.find(class_='th-pro-title')
    note=card.find(class_='th-pro-note')
    # Preserve special nested title (Fills card has a second title) by extracting only the first title/note.
    first_title=str(title) if title else ''
    first_note=str(note) if note else ''
    if title: title.extract()
    if note: note.extract()
    details=soup.new_tag('details')
    details['class']=card.get('class',[])+['beat-lab-section']
    details['open']=True
    summary=soup.new_tag('summary')
    summary['class']=['beat-lab-summary']
    left=soup.new_tag('span'); left['class']=['beat-lab-summary-copy']
    left.append(BeautifulSoup(first_title or '<span class="th-pro-title">Beat Lab</span>','html.parser'))
    if first_note:
        left.append(BeautifulSoup(first_note,'html.parser'))
    chev=soup.new_tag('span'); chev['class']=['beat-lab-chevron']; chev.string='⌄'
    summary.append(left); summary.append(chev)
    details.append(summary)
    content=soup.new_tag('div'); content['class']=['beat-lab-content']
    # Move all remaining children into content.
    for child in list(card.contents):
        content.append(child.extract())
    details.append(content)
    card.replace_with(details)
newfrag=str(soup)
s=s[:start]+newfrag+s[end:]

# Add CSS in a dedicated style block before beat-lab-polish.
css='''<style id="beat-layout-polish">\n.beat-section-heading{display:flex;align-items:center;gap:9px;margin:13px 0 7px;padding:0 2px}.beat-section-heading>span{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;background:rgba(199,165,106,.10);border:1px solid rgba(199,165,106,.18);color:#d7b878;font:8px var(--font-m);flex:none}.beat-section-heading b{display:block;font-size:11px;letter-spacing:.03em}.beat-section-heading small{display:block;color:#68645e;font-size:9px;margin-top:2px}.beat-section-heading-tight{margin-top:15px}.beat-subsection-label{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:12px 0 6px;padding:0 2px}.beat-subsection-label b{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#aaa}.beat-subsection-label span{font-size:9px;color:#62605c}.beat-sound-select{margin-top:0}.beat-lab-heading{margin-bottom:7px}.beat-lab-section{min-width:0}.beat-lab-summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;padding:0}.beat-lab-summary::-webkit-details-marker{display:none}.beat-lab-summary-copy{display:block;min-width:0}.beat-lab-summary-copy .th-pro-title{display:block}.beat-lab-summary-copy .th-pro-note{display:block;margin:3px 0 0}.beat-lab-chevron{width:24px;height:24px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.08);border-radius:8px;color:#888;flex:none;transition:transform .18s ease}.beat-lab-section[open] .beat-lab-chevron{transform:rotate(180deg);color:#d7b878}.beat-lab-content{padding-top:9px}.beat-lab-section .th-pro-title{font-size:12px}.beat-lab-section .th-pro-note{font-size:9px}.beat-lab-section .th-actions{gap:6px}.beat-lab-section .th-control{margin-top:7px}.beat-lab-section .th-mini-grid{gap:6px}\n@media(max-width:760px){#view-beat{padding-bottom:calc(195px + env(safe-area-inset-bottom))!important}.beat-section-heading{margin:11px 0 6px}.beat-section-heading-tight{margin-top:12px}.beat-section-heading small{font-size:8px}.beat-maker-hero{margin-top:4px}.beat-groove-bar{margin-bottom:5px}.mixer{padding:10px!important}.mixer .mix-head{margin-bottom:5px}.beat-tools{grid-template-columns:repeat(3,1fr);gap:6px}.beat-tools .btn{min-width:0}.sample-kit-row{padding:10px!important}.th-premium{padding:10px!important}.th-premium-grid{grid-template-columns:1fr!important;gap:7px!important}.beat-lab-section{padding:10px!important}.beat-lab-section[open]{background:rgba(255,255,255,.018)}.beat-lab-content{padding-top:8px}.beat-lab-content .th-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.beat-lab-content .th-actions-4{grid-template-columns:repeat(2,minmax(0,1fr))}.beat-lab-content .btn{min-width:0}.beat-lab-content .bass-steps{overflow-x:auto;padding-bottom:3px}.beat-subsection-label{margin-top:9px}.beat-sound-select{padding:0 0 5px!important}.beat-sound-select select{max-width:52vw!important}.beat-pad-hint{font-size:8px}.beat-groove-presets{max-width:72vw}.beat-hit-count{display:none}}\n</style>\n'''
s=s.replace('<style id="beat-lab-polish">', css+'<style id="beat-lab-polish">',1)

# Version + cache bump.
s=s.replace('1.10.34','1.10.35')
s=s.replace('v11034','v11035')
p.write_text(s,encoding='utf-8')
for fn in ['package.json','www/package.json']:
    q=root/fn
    if q.exists():
        t=q.read_text(); t=t.replace('1.10.34','1.10.35'); q.write_text(t)
(root/'TAPEHEAD-V1.10.35-BEAT-PAGE-ORGANIZED.md').write_text('''# Tapehead Pro v1.10.35 — Beat Page Organized\n\n## Goal\nReduce Beat Maker congestion without removing any existing feature.\n\n## Changes\n- Added clear Beat Setup / Pattern & Sounds / Beat Lab Pro hierarchy.\n- Added Sound Kit subsection for genre kits and custom samples.\n- Converted Beat Lab Pro cards to expandable sections, retaining all controls and IDs.\n- Mobile Beat Lab opens as compact accordions and uses two-column action groups where appropriate.\n- Added extra bottom clearance for the Studio navigation.\n- Preserved all Beat Maker, AI, bass, fills, pattern, DNA, FX, and Sound Library functionality.\n''',encoding='utf-8')
