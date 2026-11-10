import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn("inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50", className)} {...props} />;
}