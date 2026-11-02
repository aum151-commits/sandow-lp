import pathlib, re
ПРАВКА = """
<style>
/* Контраст текста усилен (02.11.2026): на светлом фоне буквы казались бледными */
body,body *{color:#1c1710 !important}
h1,h2,h3,h4{color:#14100a !important}
p,li,span,div{color:#1c1710 !important}
a,a *{color:#8a5c17 !important}
a{text-decoration-color:#c08b4e}
.tag,.pill{color:#6d4712 !important;background:#efe2c9 !important}
header *,footer *,footer a,.top *,.header *{color:#f0eade !important}
.sticky-call *,.btn,.btn *{color:#1a1408 !important}
</style>
"""
изменено = 0
for файл in pathlib.Path('.').glob('*/index.html'):
    if файл.parent.name == 'bogoroditsk':
        continue
    т = файл.read_text(encoding='utf-8')
    if 'Контраст текста усилен' in т:
        continue
    файл.write_text(т.replace('</head>', ПРАВКА + '</head>'), encoding='utf-8')
    изменено += 1
print('страниц с усиленным контрастом:', изменено)
