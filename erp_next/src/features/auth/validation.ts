import type { LoginErrors, LoginValues } from "./types";

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  if (!values.username.trim()) errors.username = "Enter your user name.";
  if (!values.password) errors.password = "Enter your password.";
  return errors;
}
