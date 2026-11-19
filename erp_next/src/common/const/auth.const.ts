import type { LoginCopy, LoginVariant } from "../type";

export const LOGIN_COPY: Record<LoginVariant, LoginCopy> = {
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

export const AUTH_MESSAGES = {
  usernameRequired: "Enter your user name.",
  passwordRequired: "Enter your password.",
} as const;
