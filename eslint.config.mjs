const globaisFoundry = {
  game: "readonly",
  Hooks: "readonly",
  foundry: "readonly",
  ui: "readonly",
  CONFIG: "readonly",
  CONST: "readonly",
  canvas: "readonly",
  ChatMessage: "readonly",
  Handlebars: "readonly",
  fromUuid: "readonly",
  fromUuidSync: "readonly",
  renderTemplate: "readonly",
  loadTemplates: "readonly",
  socketlib: "readonly",
};

// Variáveis padrão do navegador usadas (ou prováveis de serem usadas) pelo módulo.
const globaisNavegador = {
  console: "readonly",
  window: "readonly",
  document: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  structuredClone: "readonly",
  fetch: "readonly",
};

export default [
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globaisFoundry, ...globaisNavegador },
    },
    rules: {
      // --- ERROS: quebram o pipeline (bugs quase certos) ---
      "no-dupe-keys": "error",
      "no-dupe-class-members": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-self-assign": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-debugger": "error",
      "no-var": "error",

      // --- AVISOS: aparecem no log, mas não quebram o pipeline ---
      "no-undef": "warn",
      "no-unused-vars": ["warn", { args: "none" }],
      "eqeqeq": ["warn", "always"],
      "no-empty": "warn",
      "no-fallthrough": "warn",
      "no-duplicate-case": "warn",
      "no-case-declarations": "warn",
      "no-unsafe-optional-chaining": "warn",
    },
  },
];
