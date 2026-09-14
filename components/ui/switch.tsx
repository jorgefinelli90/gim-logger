import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@/lib/utils'

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-background shadow transition-transform data-checked:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
