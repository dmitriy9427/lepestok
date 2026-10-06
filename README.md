<div align="center">

<a href="https://dmitriy9427.github.io/lepestok/"><img src="docs/screenshots/lepestok-home.webp" alt="Интро: видео сквозь буквы" width="100%"></a>

# 🌸 Лепесток

**Цветочный магазин с конструктором букета — пет-проект на React 19 и TypeScript**

### [Открыть демо →](https://dmitriy9427.github.io/lepestok/)

![React 19](https://img.shields.io/badge/React_19-20232a?style=flat-square&logo=react&logoColor=61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white) ![GSAP](https://img.shields.io/badge/GSAP-0ae448?style=flat-square&logo=greensock&logoColor=black) ![WebGL](https://img.shields.io/badge/WebGL-990000?style=flat-square&logo=webgl&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=vite&logoColor=white) ![тесты 223](https://img.shields.io/badge/%D1%82%D0%B5%D1%81%D1%82%D1%8B_223-2ea44f?style=flat-square) [![Деплой](https://github.com/dmitriy9427/lepestok/actions/workflows/pages.yml/badge.svg)](https://github.com/dmitriy9427/lepestok/actions/workflows/pages.yml)

</div>

| Первый экран | Каталог: 3D-наклон и цветок | Прелоадер |
| --- | --- | --- |
| <img src="docs/screenshots/lepestok-hero.webp" alt="Первый экран"> | <img src="docs/screenshots/lepestok-catalog.webp" alt="Каталог: 3D-наклон и цветок"> | <img src="docs/screenshots/lepestok-preloader.webp" alt="Прелоадер"> |

## Коротко

| | |
| :---: | --- |
| 🎬 | **Видео сквозь буквы** — на первом экране слово «Лепесток» залито видео и раскрывается прокруткой |
| 🌷 | **Шейдерные переходы** — страница сменяется под WebGL-цветком, который распускается из центра |
| 💐 | **Конструктор букета** — цветы, оттенки, упаковка, лента; цена и бюджет считаются сразу, состав — в адресе |
| 🗂 | **Каталог** — фильтры в адресе, перестановка карточек через GSAP Flip, 3D-наклон и цветок при наведении |
| 🌙 | **Тёмная тема** — переключатель-цветок, системная тема на лету, без вспышки при загрузке |
| ✅ | **Качество** — 223 теста, строгий TypeScript, ESLint/Stylelint, «меньше движения» везде |

Автор — [Дмитрий Рябов](https://dmitriy9427.github.io/resume/), frontend-разработчик.

---

## Что есть

- **Прелоадер первой загрузки** — лепестки логотипа распускаются по одному, кольцо
  прогресса; ждёт шрифты и постер (1,3–4 с), один раз за сессию. Уходит в шейдерную
  заливку, которая растворяется цветком (разметка — `index.html`,
  логика — `src/modules/preloader.ts`).
- **Переходы между страницами** — WebGL-шейдер «распускающийся цветок»: заливка из
  центра → смена страницы → раскрытие из центра (`src/modules/pageTransition.ts`).
- **Первый экран «видео сквозь буквы»** — тёмный экран, в огромном слове
  «Лепесток» играет видео букета; при прокрутке буквы растут и растворяются,
  открывается полноэкранное видео с заголовком (`src/modules/heroReveal.ts`).
  «Меньше движения» — сразу постер и текст, без интро.
- **Конструктор букета** (`/builder`) — цветы, оттенки, упаковка и лента. У каждого
  оттенка каждого цветка — своё фото (33 шт.). «Ваш букет» — коллаж из этих фото
  с количеством. Цена с расшифровкой, бюджет («уложиться в 5 000 ₽» — подскажет, что
  убрать), состав в адресе — ссылкой можно поделиться.
- **Каталог** (`/catalog`) — фото букетов, фильтры (повод, цена, цветы, оттенок),
  сортировка, всё в адресе («Назад» работает). Перестановка карточек — GSAP Flip.
  Загрузка/ошибка/пусто — как с настоящим API (`/catalog?fail` — проверить ошибку).
- **Страница букета** — размер S/M/L меняет состав и цену, открытка с предпросмотром,
  «собрать похожий» → конструктор.
- **Корзина и оформление в 3 шага** — схемы проверки как в zod, маска телефона,
  интервалы доставки (к ближайшему не успеть — недоступен), ошибка с сервера
  возвращает на нужный шаг (имя получателя «ошибка» — проверить).
- **Подписка** с калькулятором выгоды, **избранное**, **бесконечная 3D-галерея**
  на главной, лепестки на canvas, 404 с увядшим цветком.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5174
npm run check      # линтеры + типы + тесты + сборка
npm run build      # готовый сайт в dist/ (SPA: хостинг должен отдавать index.html на любой путь)
```

Учебная 3D-модель букета (на сайте не используется — первый экран сделан видео):

```bash
blender -b --python blender/bouquet.py   # → blender/bouquet.glb, см. blender/README.md
```

## Что где менять

| Что                                          | Где                                                        |
| -------------------------------------------- | ---------------------------------------------------------- |
| Цветы, цены, оттенки, упаковка, ленты        | `src/data/flowers.ts`                                      |
| Готовые букеты (состав → цена), фото, поводы | `src/data/bouquets.ts`, фото — `public/photos/`            |
| Тексты главной: шаги, отзывы, вопросы        | `src/data/content.ts`                                      |
| Доставка: интервалы, время сборки, цены      | `src/lib/delivery.ts`                                      |
| Подписка: размеры, частота, скидки           | `src/lib/subscription.ts`                                  |
| Фото цветов по оттенкам                      | `public/photos/flowers/<цветок>-<оттенок>.jpg` (300×300)   |
| Видео первого экрана и постер (1920×1080)    | `public/video/hero.mp4`, `hero-poster.jpg`                 |
| Цвета, шрифты                                | `src/styles/_abstracts.scss` (+ импорт шрифтов `main.tsx`) |
| Отправка заказа (сейчас имитация)            | `src/lib/api.ts` — замените тела функций на `fetch`        |
| Проверка полей заказа                        | `src/forms/schemas.ts`                                     |

## Где что лежит

```
src/
  data/        справочники и контент
  lib/         чистая логика (цена, фильтры, доставка, корзина, рисунок) — покрыта тестами
  modules/     свой модуль по контракту кита: petals (лепестки на canvas)
  components/  шапка, подвал, карточка, галерея, рисунок букета…
  pages/       страницы (лениво, кроме главной)
  hooks/       useAsync — загрузка с отменой и «повторить»
  forms/       схемы форм
  styles/      SCSS: настройки, каркас, элементы, секции
blender/       скрипт 3D-модели, сцена .blend, превью
kit/           общий кит (модули, SCSS, React-адаптер, dev-панель) — docs/
```

## Возможные проблемы

| Симптом                                                       | Причина и решение                                                                                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Рядом с красивым селектом виден обычный `<select>`            | Старая копия кита: в StrictMode отменённый экземпляр модуля снимал класс у живого. Исправлено в `kit/react/useModule.js` (экземпляры по очереди) — обновите кит. |
| Модуль кита в условном блоке (`{x && <div ref>}`) не работает | `useModule` запускает модуль при монтировании компонента. Вынесите блок в отдельный компонент (так сделаны `PriceRange`, `Greeting`).                            |
| Нет фото у нового оттенка цветка                              | Тест «у каждого оттенка есть фото» упадёт и назовёт файл. Положите `public/photos/flowers/<цветок>-<оттенок>.jpg`.                                               |
| Заголовки «не тем» шрифтом                                    | Нет кириллицы в шрифте (Fraunces так и выбыл). Проверяйте `node_modules/@fontsource-variable/<шрифт>/files/*cyrillic*`.                                          |
| В 3D-галерее чёрные картинки                                  | Прозрачные PNG/SVG в WebGL-текстуре — чёрные. Используйте непрозрачные фото (jpg).                                                                               |
| Видео не играет на iPhone                                     | Нужны `muted` + `playsInline` + `autoPlay`, иначе iOS не запускает его сам. При «меньше движения» показывается только постер — так задумано.                     |
| Фото не грузятся в 3D-галерее с CDN                           | Картинки с другого домена для WebGL — только с CORS. Держите их в `public/` или на CDN с `Access-Control-Allow-Origin`.                                          |
| Страница по прямой ссылке /catalog даёт 404 на хостинге       | SPA: настройте отдачу `index.html` на любой путь — `docs/deploy.md`.                                                                                             |
| Основной бандл ~575 КБ                                        | React + GSAP + Swiper. three.js (~560 КБ) — отдельный ленивый файл, только для 3D. Уменьшить: убрать Swiper из отзывов (заменить на `slider` кита).              |

Общие баги кита — [docs/troubleshooting.md](docs/troubleshooting.md).

## Авторы фото

Фото букетов и цветов — [Pexels](https://www.pexels.com/license/) (бесплатная лицензия):
Julia Çarı, Shameel Mukkath, Faustin Nkurunziza, Katrenur, Brent Keane, Vladimir Srajber,
Ssümçiğ, Anastasiya Badun, Ellie Burgin, Michael Obstoj, Tuan Vy, Marta Dzedyshko,
Audrey Bory, Amelia Cui, Brendan Rühli, Alex Ohan, Jobayer Ahmed, Vera Emilie,
cottonbro studio, Calaful Prints, Kaboompics, Siegfried Poepperl, Zoryana Lavruk,
Iuliia Pilipeichenko, Natalia Sevruk, Bloatware Rejuvenation, Hilal, Nguyễn Vũ, Galina K.,
Şeydanur Yıldız, Olena Bohovyk, Gintare Baradinske, hatice genç, Joanna Niechciał,
Temidayo Aladesuyi, Sephina Cornwall, Vlad Ioan, Gije Cho, Cup of Honey Lemon, Sônia Motta,
Pawel Konrad, Olya Prutskova, Shawn Nguyen, Cz Jen. Ссылки на букеты — поле `credit` в
`src/data/bouquets.ts`.

Видео первого экрана — Mikhail Nilov / [Pexels](https://www.pexels.com/video/8246501/).
