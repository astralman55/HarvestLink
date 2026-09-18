"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

// USR-1: show/hide toggle, paste allowed (native input default), correct
// autocomplete left to the caller (`new-password` at signup, `current-password` at login).
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className={`pr-10 ${className ?? ""}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-stone-500 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
