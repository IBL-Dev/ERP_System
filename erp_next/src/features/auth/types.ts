export type LoginVariant = "user" | "admin";

export type LoginValues = {
  username: string;
  password: string;
};

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;
