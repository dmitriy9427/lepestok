/**
 * Дымовые тесты приложения: страницы рендерятся, роутинг работает,
 * ключевые сценарии (каталог с фильтром из адреса, конструктор из адреса,
 * корзина) живы. Логика — в src/lib/lib.test.ts.
 */
import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { KitProvider } from 'kit/react/index.js'
import { App } from './App'
import { cart } from './lib/cart'

afterEach(cleanup)
beforeEach(() => cart.set([]))

async function renderAt(path: string) {
  render(
    <KitProvider smooth={false}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </KitProvider>,
  )
  // Ленивые страницы и «сеть» (в тестах без задержки) — даём им отработать.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30))
  })
}

describe('App', () => {
  it('главная: заголовок, меню, видео букета с постером', async () => {
    await renderAt('/')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Букеты')
    expect(document.querySelector('.hero-video video')?.getAttribute('poster')).toBe('/video/hero-poster.jpg')
    expect(document.querySelector('.burger')?.getAttribute('aria-controls')).toBe('site-menu')
  })

  it('каталог: фильтр из адреса применяется', async () => {
    await renderAt('/catalog?tone=red')
    expect(await screen.findByText(/^\d+ букет/)).toBeTruthy()
    const titles = [...document.querySelectorAll('.bouquet-card__title')].map((el) => el.textContent)
    expect(titles).toContain('Алая страсть')
    expect(titles).not.toContain('Облако')
  })

  it('страница букета и 404 для несуществующего', async () => {
    await renderAt('/bouquet/oblako')
    expect(await screen.findByRole('heading', { level: 1, name: 'Облако' })).toBeTruthy()
    cleanup()
    await renderAt('/bouquet/net-takogo')
    expect(await screen.findByText(/завяла/)).toBeTruthy()
  })

  it('конструктор восстанавливает состав из адреса', async () => {
    await renderAt('/builder?s=rose.red.3&w=kraft&r=twine')
    expect(await screen.findByText('3 розы (красный)')).toBeTruthy()
  })

  it('корзина: пустая и с букетом', async () => {
    await renderAt('/cart')
    expect(await screen.findByText('Корзина пуста')).toBeTruthy()
    cleanup()
    cart.set([
      {
        id: 'x',
        title: 'Тест',
        composition: { stems: [{ flower: 'rose', color: 'red', count: 3 }], wrap: 'kraft', ribbon: 'twine' },
        card: '',
        qty: 2,
      },
    ])
    await renderAt('/cart')
    expect(await screen.findByText('Тест')).toBeTruthy()
  })
})
