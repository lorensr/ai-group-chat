const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "turbo",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project,
    tsconfigRootDir: process.cwd(),
  },
  env: {
    node: true,
    es2020: true,
  },
  plugins: [
    "@typescript-eslint",
    // Add other plugins if needed
  ],
  ignorePatterns: ["node_modules/", "dist/", ".*.js"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        // You can add or override rules here
      },
    },
  ],
};
