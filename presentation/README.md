# Презентация

`Qadam_LOCUS_Case02.pdf` — 8 слайдов для сабмита: проблема, решение,
демонстрация, персонализация, технология, преимущества, команда и развитие.

Источник — `deck.html`: обычная HTML-страница, где каждый `<section class="slide">`
это слайд 1280×720. Скриншоты продукта лежат в `assets/` и сняты с работающего
приложения, а не нарисованы.

## Как пересобрать PDF

Открыть `deck.html` в браузере и напечатать в PDF с размером страницы
1280×720 px, нулевыми полями и включённой фоновой графикой.

Либо headless-Chromium:

```bash
npx playwright install chromium   # один раз
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/presentation/deck.html', { waitUntil: 'networkidle' });
  await p.pdf({ path: 'presentation/Qadam_LOCUS_Case02.pdf', width: '1280px', height: '720px',
                printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await b.close();
})();
"
```

Перед сабмитом на 8-м слайде нужно заполнить состав команды и ссылки
на демо и репозиторий.
