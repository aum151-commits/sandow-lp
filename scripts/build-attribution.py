"""Embed the canonical attribution module into already loaded assets (no new network dependency)."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
start='/* SNDW_ATTRIBUTION_BEGIN */'
end='/* SNDW_ATTRIBUTION_END */'
source=(root/'scripts/lead-attribution.js').read_text(encoding='utf-8')
for name in ('c.js','nav-moskva.js'):
 p=root/name
 text=p.read_text(encoding='utf-8')
 if start in text:
  a=text.index(start);b=text.index(end,a)+len(end)
  text=text[:a]+text[b:]
 text=text.rstrip()+'\n\n'+start+'\n'+source.rstrip()+'\n'+end+'\n'
 p.write_text(text,encoding='utf-8')
 print(name,'embedded',len(source),'characters')
