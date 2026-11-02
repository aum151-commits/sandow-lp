import pathlib
from playwright.sync_api import sync_playwright
файл = pathlib.Path('beg-dlya-nachinayuschih/index.html').resolve()
выход = pathlib.Path(r'D:\Проекты\Богородицк\статьи\_скриншоты\москва-контраст.png')
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={'width':400,'height':900}, locale='ru-RU'); pg = ctx.new_page()
    pg.goto(файл.as_uri(), wait_until='load'); pg.wait_for_timeout(700)
    pg.evaluate('() => window.scrollBy(0, 500)'); pg.wait_for_timeout(400)
    print('цвет абзаца:', pg.evaluate('() => { const п = [...document.querySelectorAll("p")].find(э => э.innerText.length > 80); return п ? getComputedStyle(п).color : "нет"; }'))
    pg.screenshot(path=str(выход), full_page=False)
    print('снимок:', выход.exists())
    b.close()
