import { AUTH_MESSAGES } from "@/common/const";
import type { LoginErrors, LoginValues } from "@/common/type";

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  if (!values.username.trim()) errors.username = AUTH_MESSAGES.usernameRequired;
  if (!values.password) errors.password = AUTH_MESSAGES.passwordRequired;
  return errors;
}
