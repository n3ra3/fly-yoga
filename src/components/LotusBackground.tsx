import type { CSSProperties } from 'react'

/**
 * Декоративные лотосы из логотипа на фоне сайта.
 * Зафиксированы (fixed) — остаются на месте при прокрутке и «сопровождают» посетителя.
 * Используем CSS-маску, чтобы перекрасить чёрный PNG в зелёный цвет студии.
 *
 * Насыщенность регулируется классом opacity-[…] у каждого лотоса.
 * Внимание: значения выше ~0.2 начинают перебивать текст.
 */
const lotusMask: CSSProperties = {
  WebkitMaskImage: 'url(/logo.png)',
  maskImage: 'url(/logo.png)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
}

export function LotusBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* крупный справа сверху */}
      <div
        style={lotusMask}
        className="absolute -right-24 top-16 h-[380px] w-[560px] rotate-6 bg-primary opacity-[0.16]"
      />
      {/* средний слева снизу */}
      <div
        style={lotusMask}
        className="absolute -left-28 bottom-8 hidden h-[300px] w-[440px] -rotate-12 bg-primary opacity-[0.14] md:block"
      />
      {/* третий — слева сверху, поменьше и под другим углом */}
      <div
        style={lotusMask}
        className="absolute -left-16 top-1/3 hidden h-[240px] w-[360px] rotate-[14deg] bg-primary opacity-[0.11] lg:block"
      />
    </div>
  )
}
