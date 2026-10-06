/**
 * Первый экран «видео сквозь буквы»: сначала тёмный экран, в котором огромное
 * слово «Лепесток» залито живым видео букета. При прокрутке буквы растут
 * и растворяются — открывается всё видео, выезжают заголовок и кнопки.
 *
 *   <section class="hero" ref={useModule(heroReveal)}>
 *     <div class="hero__stage">          ← sticky, 100svh
 *       <video class="hero__video"/>
 *       <div class="hero__mask"><span>Лепесток</span></div>
 *       <div class="hero__content">…</div>
 *
 * ─── Как буквы «вырезаны» ──────────────────────────────────────────────────
 * .hero__mask — тёмный слой с БЕЛЫМ текстом и mix-blend-mode: multiply:
 * тёмное × видео = почти тёмное, белое × видео = само видео. Никаких SVG-масок
 * и canvas: один div, работает везде, текст остаётся текстом.
 *
 * ─── Прокрутка ─────────────────────────────────────────────────────────────
 * Секция высотой 200svh, сцена внутри — position: sticky. Пин делает CSS,
 * ScrollTrigger только двигает «ползунок» анимации (scrub) — на телефоне
 * без дёрганий при скрытии адресной строки.
 *
 * Без JS и с «меньше движения» маска скрыта (CSS), контент виден сразу, секция
 * обычной высоты. Видео — только пока секция на экране (батарея).
 */
import { gsap, ScrollTrigger } from 'kit/js/core/gsap.js'
import { createDisposer, onViewport } from 'kit/js/core/lifecycle.js'

export default function heroReveal(section: HTMLElement, ctx: { reduced?: boolean } = {}) {
  const d = createDisposer()
  const video = section.querySelector<HTMLVideoElement>('.hero__video')

  if (video) {
    // React ставит muted свойством уже после вставки в DOM — без явного
    // muted браузер может отклонить play() как «видео со звуком».
    video.muted = true
    d.add(
      onViewport(section, {
        enter: () => {
          if (!ctx.reduced) video.play().catch(() => {})
        },
        leave: () => video.pause(),
      }),
    )
  }

  // Шапка прозрачная, пока под ней hero (и при прокрутке назад тоже) —
  // иначе над тёмным видео вспыхивает кремовая полоса. Стили — .is-over-hero.
  const header = document.querySelector('.header')
  if (header) {
    const over = ScrollTrigger.create({
      trigger: section,
      // −1, а не 'top top' (= 0): на прокрутке ровно 0 ScrollTrigger считает,
      // что ушли «назад за начало», и снимал класс в самом верху страницы.
      start: -1,
      end: () => `bottom top+=${header.getBoundingClientRect().height}`,
      onToggle: (self) => header.classList.toggle('is-over-hero', self.isActive),
    })
    header.classList.toggle('is-over-hero', over.isActive)
    // Интро тёмное (шапка светлая), раскрытый кадр светлый (шапка тёмная):
    // переключаем на середине раскрытия. Без интро — сразу светлый кадр.
    const light = (on: boolean) => header.classList.toggle('is-hero-light', on)
    light(Boolean(ctx.reduced))
    const phase = ctx.reduced
      ? null
      : ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => light(self.progress > 0.45),
        })
    d.add(() => {
      over.kill()
      phase?.kill()
      header.classList.remove('is-over-hero', 'is-hero-light')
    })
  }

  if (ctx.reduced) return { destroy: d.dispose }
  section.classList.add('is-intro')

  const mask = section.querySelector('.hero__mask')
  const word = section.querySelector('.hero__word')
  const content = section.querySelectorAll('.hero__content > *')
  const hint = section.querySelector('.hero__hint')
  const shade = section.querySelector('.hero__shade')

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  })
  // В интро видео приближено к центру букета — в буквы попадают лепестки,
  // а не светлый фон; к концу — обычный кадр.
  tl.to(hint, { autoAlpha: 0, duration: 0.1 }, 0)
    .fromTo(video, { scale: 1.45, transformOrigin: '45% 45%' }, { scale: 1, ease: 'power1.inOut', duration: 0.85 }, 0)
    .fromTo(shade, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.5)
    .fromTo(word, { scale: 1 }, { scale: 9, ease: 'power2.in', duration: 0.7 }, 0)
    .to(mask, { autoAlpha: 0, ease: 'power1.in', duration: 0.45 }, 0.3)
    .fromTo(
      content,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, ease: 'power2.out', stagger: 0.06, duration: 0.3 },
      0.55,
    )

  // Текст прячем только opacity (не visibility): заголовок остаётся для
  // скринридеров. Tab на невидимую кнопку — сразу проматываем интро к концу.
  d.listen(section, 'focusin', () => {
    const st = tl.scrollTrigger
    if (st && st.progress < 1) window.scrollTo({ top: st.end, behavior: 'instant' })
  })

  // Шрифт Cormorant догружается позже — ширина слова меняется; пересчёт.
  document.fonts?.ready.then(() => ScrollTrigger.refresh())

  d.add(() => {
    tl.scrollTrigger?.kill()
    tl.kill()
    gsap.set([video, shade, word, mask, hint, ...content].filter(Boolean), { clearProps: 'all' })
    section.classList.remove('is-intro')
  })
  return { destroy: d.dispose }
}
