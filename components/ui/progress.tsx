import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn } from '@/lib/utils'

interface ProgressProps extends Omit<ProgressPrimitive.Root.Props, 'value'> {
  value: number
  label?: string
  className?: string
  indicatorClassName?: string
}

function Progress({ value, label, className, indicatorClassName, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root value={value} className={cn('grid gap-1.5', className)} {...props}>
      {label && <ProgressPrimitive.Label className="text-xs font-medium text-muted-foreground">{label}</ProgressPrimitive.Label>}
      <ProgressPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <ProgressPrimitive.Indicator
          className={cn('block h-full rounded-full bg-primary transition-[width] duration-300 ease-out', indicatorClassName)}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
