export default [
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-dupe-keys": "error",
      "no-dupe-class-members": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-self-assign": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
    },
  },
];