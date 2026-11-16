"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { LoginErrors, LoginValues, LoginVariant } from "../types";
import { validateLogin } from "../validation";

const COPY: Record<LoginVariant, { title: string; hint: string; submit: string }> = {
  user: {
    title: "Log on",
    hint: "Enter your user name and password.",
    submit: "Log on",
  },
  admin: {
    title: "Administrator log on",
    hint: "Enter your administrator user name and password.",
    submit: "Log on as admin",
  },
};

export function LoginForm({ variant = "user" }: { variant?: LoginVariant }) {
  const router = useRouter();
  const copy = COPY[variant];
  const [values, setValues] = useState<LoginValues>({ username: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof LoginValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const found = validateLogin(values);
    setErrors(found);
    if (found.username) return userRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();

    // TODO: call the authentication API here (use `variant` to pick user vs admin endpoint).
    // Until then any non-empty user and password opens Easy Access.
    router.push("/home");
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-md border border-line bg-panel p-6 shadow-sm"
    >
      <h1 className="text-lg font-semibold">{copy.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{copy.hint}</p>

      <div className="mt-6 space-y-4">
        <TextField
          ref={userRef}
          label="User"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          value={values.username}
          onChange={update("username")}
          error={errors.username}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="mr-1 grid h-7 w-7 place-items-center rounded text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && <path d="M4 4l16 16" />}
              </svg>
            </button>
          }
        />
      </div>

      <div className="mt-6 sm:pl-[8rem]">
        <Button type="submit">{copy.submit}</Button>
      </div>
    </form>
  );
}
