import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-800 text-zinc-300",
        green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        red: "bg-red-500/10 text-red-400 border border-red-500/20",
        yellow: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        orange: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        gray: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
      },
      dot: {
        true: "relative pl-5 before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, dot, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, dot }), className)} {...props} />
}

export { Badge, badgeVariants }
