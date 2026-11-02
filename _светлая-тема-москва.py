import pathlib
КОРЕНЬ = pathlib.Path('.')
СТИЛИ = """
<style>
/* Светлая тема для чтения (02.11.2026): тёмный фон плохо читался */
:root{--bg:#f6f0e4;--panel:#fffaf0;--line:#e3d7c0;--ink:#241c12;--gold:#b07d2a;--gold2:#8a5c17}
body{background:#f6f0e4;color:#241c12}
h1,h2,h3{color:#241c12}
p,li{color:#3a2f22;line-height:1.8}
a{color:#b07d2a}
p{margin:0 0 20px}
h2{margin-top:44px;margin-bottom:18px}
</style>
"""
страницы = [ф for ф in КОРЕНЬ.glob('*/index.html') if ф.parent.name != 'bogoroditsk']
изменено = 0
for файл in страницы:
    т = файл.read_text(encoding='utf-8')
    if 'Светлая тема для чтения' in т:
        continue
    файл.write_text(т.replace('</head>', СТИЛИ + '</head>'), encoding='utf-8')
    изменено += 1
print('страниц перекрашено:', изменено, 'из', len(страницы))
