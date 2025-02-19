// src/utils/get-env.ts
export const getEnv = (key: string, defaultValue: string = ""): string => {
  const value = process.env[key];

  // Modification cruciale ici
  if (typeof value === "undefined" && typeof defaultValue === "undefined") {
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value || defaultValue;
};