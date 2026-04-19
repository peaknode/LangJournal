import * as React from "react"
import { cn } from "@langjournal/ui/lib/utils"

type TypographyVariant =
  | 'display-lg' | 'display-md' | 'display-sm'
  | 'headline-lg' | 'headline-md' | 'headline-sm'
  | 'title-lg' | 'title-md' | 'title-sm'
  | 'body-lg' | 'body-md' | 'body-sm'
  | 'label-lg' | 'label-md' | 'label-sm'

type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label' | 'div'

const variantStyles: Record<TypographyVariant, string> = {
  // Display Styles
  'display-lg': 'text-[3.5rem] font-bold leading-tight font-display tracking-[-0.02em]',
  'display-md': 'text-[2.25rem] font-bold leading-tight font-display tracking-[-0.02em]',
  'display-sm': 'text-[1.875rem] font-bold leading-tight font-display tracking-[-0.02em]',

  // Headline Styles
  'headline-lg': 'text-[1.875rem] font-semibold leading-snug font-display tracking-[-0.02em]',
  'headline-md': 'text-[1.5rem] font-semibold leading-snug font-display tracking-[-0.02em]',
  'headline-sm': 'text-[1.25rem] font-semibold leading-snug font-display tracking-[-0.02em]',

  // Title Styles
  'title-lg': 'text-[1.25rem] font-semibold leading-normal font-body',
  'title-md': 'text-[1.125rem] font-semibold leading-normal font-body',
  'title-sm': 'text-[1rem] font-semibold leading-normal font-body',

  // Body Styles
  'body-lg': 'text-[1.125rem] font-normal leading-[1.75] font-body',
  'body-md': 'text-[1rem] font-normal leading-[1.6] font-body',
  'body-sm': 'text-[0.875rem] font-normal leading-[1.6] font-body',

  // Label Styles
  'label-lg': 'text-[0.875rem] font-semibold leading-normal font-body uppercase tracking-wider',
  'label-md': 'text-[0.75rem] font-semibold leading-normal font-body uppercase tracking-widest',
  'label-sm': 'text-[0.625rem] font-semibold leading-normal font-body uppercase tracking-widest',
}

const elementMap: Record<TypographyVariant, TypographyElement> = {
  'display-lg': 'h1',
  'display-md': 'h1',
  'display-sm': 'h2',
  'headline-lg': 'h2',
  'headline-md': 'h3',
  'headline-sm': 'h4',
  'title-lg': 'h5',
  'title-md': 'h5',
  'title-sm': 'h6',
  'body-lg': 'p',
  'body-md': 'p',
  'body-sm': 'p',
  'label-lg': 'label',
  'label-md': 'label',
  'label-sm': 'label',
}

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant
  as?: TypographyElement
  children: React.ReactNode
}

/**
 * Neo-Stationery Atelier 디자인 시스템의 타이포그래피 컴포넌트
 *
 * @example
 * <Typography variant="display-lg">큰 제목</Typography>
 * <Typography variant="body-md">본문 텍스트</Typography>
 * <Typography variant="headline-lg" as="h2">커스텀 제목</Typography>
 */
const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body-md', as, children, ...props }, ref) => {
    const Element = (as || elementMap[variant]) as React.ElementType

    return (
      <Element
        ref={ref}
        className={cn(
          variantStyles[variant],
          'text-on-surface',
          className
        )}
        {...props}
      >
        {children}
      </Element>
    )
  }
)

Typography.displayName = 'Typography'

export { Typography, type TypographyVariant, type TypographyProps }
