/**
 * Маленькое хранилище состояния с сохранением в localStorage — для корзины
 * и избранного. Без Redux/Zustand: хватает useSyncExternalStore из React.
 *
 *   const cart = createStore('cart', [], (v) => (Array.isArray(v) ? v : []))
 *   const items = cart.use()          // в компоненте — перерисуется при изменении
 *   cart.set((prev) => [...prev, x])  // где угодно
 *
 * ─── Баги, закрытые здесь ───────────────────────────────────────────────────
 * 1. В localStorage может лежать что угодно (старая версия сайта, правка руками) —
 *    всё прочитанное проходит через validate.
 * 2. Две вкладки: положили в корзину в одной — счётчик обновился в другой
 *    (событие storage).
 * 3. Приватный режим / запрет cookies — kit/core/storage молча работает
 *    без сохранения, сайт не падает.
 * 4. useSyncExternalStore требует, чтобы get() возвращал ТОТ ЖЕ объект, пока
 *    данные не менялись, иначе бесконечный цикл рендеров. Поэтому state
 *    хранится в переменной, а не читается из localStorage при каждом get().
 */
import { useSyncExternalStore } from 'react'
import { readStorage, writeStorage } from 'kit/js/core/storage.js'

export function createStore<T>(key: string, initial: T, validate: (value: unknown) => T) {
  let state = validate(readStorage(key, initial))
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return
    state = validate(readStorage(key, initial))
    emit()
  }

  const get = () => state

  function set(next: T | ((prev: T) => T)) {
    state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
    writeStorage(key, state)
    emit()
  }

  function subscribe(listener: () => void) {
    if (!listeners.size) window.addEventListener('storage', onStorage)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (!listeners.size) window.removeEventListener('storage', onStorage)
    }
  }

  return {
    get,
    set,
    subscribe,
    use: () => useSyncExternalStore(subscribe, get, get),
    /** Для тестов: перечитать хранилище. */
    reload: () => {
      state = validate(readStorage(key, initial))
      emit()
    },
  }
}
