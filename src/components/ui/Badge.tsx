import { cn } from '@/lib/utils'

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'indigo'

interface BadgeProps {
  children: React.ReactNode
  color?: Color
  className?: string
}

const colors: Record<Color, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-100 text-indigo-700',
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colors[color], className)}>
      {children}
    </span>
  )
}
