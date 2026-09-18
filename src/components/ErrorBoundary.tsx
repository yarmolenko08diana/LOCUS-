import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clear } from '../store/storage'

interface State {
  error: Error | null
}

/**
 * Последняя линия обороны. Без неё любая ошибка рендера даёт белый экран, и
 * пользователь остаётся без пути и без объяснения. Здесь он как минимум видит,
 * что произошло, и может сбросить сохранённые данные — самая вероятная причина
 * поломки после изменения формата профиля.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Qadam: непредвиденная ошибка', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
        <div className="card p-6">
          <div aria-hidden className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-coral-50 text-xl">⚠</div>
          <h1 className="text-[22px] font-extrabold leading-snug">Что-то сломалось</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            Приложение не смогло отрисовать этот экран. Данные анкеты хранятся только
            в браузере, поэтому чаще всего помогает их сброс — путь придётся пройти заново.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-paper px-3.5 py-3 text-[12px] leading-relaxed text-ink-muted">
            {error.message}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink-soft transition-colors hover:border-brand-300"
            >
              Перезагрузить
            </button>
            <button
              type="button"
              onClick={() => { clear(); window.location.hash = '#/'; window.location.reload() }}
              className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-4 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Сбросить данные и начать заново
            </button>
          </div>
        </div>
      </div>
    )
  }
}
