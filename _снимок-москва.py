import pathlib
from playwright.sync_api import sync_playwright
файл = pathlib.Path('beg-dlya-nachinayuschih/index.html').resolve()
print('файл есть:', файл.exists())
выход = pathlib.Path(r'D:\Проекты\Богородицк\статьи\_скриншоты\москва-светлая.png')
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={'width':400,'height':900}, locale='ru-RU'); pg = ctx.new_page()
    pg.goto(файл.as_uri(), wait_until='load'); pg.wait_for_timeout(700)
    print('фон:', pg.evaluate('() => getComputedStyle(document.body).backgroundColor'))
    pg.screenshot(path=str(выход), full_page=False)
    print('снимок:', выход.exists())
    b.close()
