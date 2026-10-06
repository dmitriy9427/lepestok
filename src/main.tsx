/**
 * Точка входа React-приложения.
 *   StrictMode — в разработке запускает эффекты дважды, чтобы ловить утечки
 *   (модули кита к этому готовы: каждый полностью убирает за собой).
 *   KitProvider — общий контекст кита: шина событий, плавный скролл.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { KitProvider } from 'kit/react/index.js'
import { App } from './App'
import '@fontsource-variable/cormorant'
import '@fontsource-variable/manrope'
import './styles/main.scss'

// Смена системной темы на лету (пользователь сам тему не выбирал —
// data-theme нет): CSS перестроится сам, а JS-слушателям (ползунок
// переключателя, фоновые цветы) шлём то же событие, что и переключатель.
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (document.documentElement.dataset.theme) return
  document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme: event.matches ? 'dark' : 'light' } }))
})

const root = document.getElementById('root')
if (!root) throw new Error('Нет элемента #root в index.html')

createRoot(root).render(
  <StrictMode>
    <KitProvider smooth>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </KitProvider>
  </StrictMode>,
)

// Dev-панель — только в разработке (в сборку не попадает, см. kit/devtools).
if (import.meta.env.DEV) {
  import('kit/devtools/index.js').then((m) => m.installDevtools())
}
