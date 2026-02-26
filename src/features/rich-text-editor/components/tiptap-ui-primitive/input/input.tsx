"use client"

import { cn } from "@/features/rich-text-editor/lib/tiptap-utils"
import "@/features/rich-text-editor/components/tiptap-ui-primitive/input/input.scss"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} className={cn("tiptap-input", className)} {...props} />
  )
}

function InputGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("tiptap-input-group", className)} {...props}>
      {children}
    </div>
  )
}

export { Input, InputGroup }
