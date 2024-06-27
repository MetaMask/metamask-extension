// this file is named .eslintrc.js because eslint checks for that file first

module.exports = {
  rules: {
    '@typescript-eslint/no-shadow': [
      'error',
      {
        allow: [
          // so uh, these aren't always globals, ya know.
          'describe',
          'it',
          'test',
          'afterEach',
          'beforeEach',
        ],
      },
    ],
    // useful for lazy `require`s (makes start up faster)
    '@typescript-eslint/no-require-imports': 'off',
    // useful for modifying properties of `require`d modules (something `import`ed modules don't allow)
    '@typescript-eslint/no-var-requires': 'off',
    // Fun fact: ESM imports _require_ extensions. So silly.
    'import/extensions': 'off',
    // sometimes its nice to do things like `something = else = null;`
    'no-multi-assign': ['error', { ignoreNonDeclaration: true }],
    // Why? What's next, no addition?
    'no-bitwise': 'off',
    // `void` is useful to ignore return values, the option `allowAsStatement: true` is broken for lambda functions, e.g., `() => void something()`.
    'no-void': 'off',
    // `if (condition) return;` is useful for early returns without adding noise.
    curly: ['error', 'multi-line'],
    // require is required to load dynamic modules (well, JSON, mostly) synchronously (with Node's require cache, too!).
    'import/no-dynamic-require': 'off',
    // uh, they're bullet points in markdown in a JSDoc comment. Stop this nonsense.
    'jsdoc/no-multi-asterisks': ['error', { allowWhitespace: true }],
    // Really? I was joking about "no addition" above, but its (almost) real!
    'no-plusplus': 'off',
    // I want to increment a variable outside my loop. This prevents that.
    'no-loop-func': 'off',
  },
};
