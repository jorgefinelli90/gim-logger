import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

/** Bottom sheet on mobile (easy one-hand reach), right-side panel from sm breakpoint up. */
function SheetContent({ className, children, showClose = true, ...props }: DialogPrimitive.Popup.Props & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <DialogPrimitive.Popup
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-6 text-card-foreground shadow-lg outline-none transition-transform data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full',
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[420px] sm:max-w-[90vw] sm:rounded-t-none sm:rounded-l-2xl sm:border-t-0 sm:border-l',
          'sm:data-[ending-style]:translate-x-full sm:data-[ending-style]:translate-y-0 sm:data-[starting-style]:translate-x-full sm:data-[starting-style]:translate-y-0',
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-muted sm:hidden" aria-hidden />
        {children}
        {showClose && (
          <DialogPrimitive.Close
            aria-label="Cerrar"
            className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...props} />
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className={cn('text-base font-semibold text-foreground', className)} {...props} />
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription }
