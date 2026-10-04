/**
 * Загрузка данных с состояниями: loading → success | error, и «повторить».
 *
 *   const { status, data, error, retry } = useAsync((signal) => fetchBouquets(signal), [])
 *
 * Ушли со страницы до ответа — запрос отменяется (AbortController), и
 * setState на размонтированном компоненте не случается. Ответ на старый
 * запрос, пришедший после нового (гонка), игнорируется.
 */
import { useCallback, useEffect, useState, type DependencyList } from 'react'

type State<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }

export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<State<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    load(controller.signal).then(
      (data) => !controller.signal.aborted && setState({ status: 'success', data }),
      (error: Error) => !controller.signal.aborted && setState({ status: 'error', error }),
    )
    return () => controller.abort()
    // load — новая функция на каждый рендер, поэтому её нет в зависимостях:
    // перезапуск — только когда меняется то, что передал вызывающий (deps).
  }, [...deps, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, retry }
}
