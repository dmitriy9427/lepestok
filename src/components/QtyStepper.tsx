/**
 * Количество «− 1 +» для React-состояния (корзина, конструктор).
 * Модуль stepper кита рассчитан на неконтролируемое поле формы; здесь
 * значение живёт в React, поэтому свой маленький компонент с теми же стилями (.stepper).
 */
interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  small?: boolean
}

export function QtyStepper({ value, onChange, min = 0, max = 99, label, small = false }: Props) {
  return (
    <div className={`stepper ${small ? 'stepper--sm' : ''}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Меньше">
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Больше">
        +
      </button>
    </div>
  )
}
