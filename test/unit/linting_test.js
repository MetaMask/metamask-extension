// LINTING:
const lint = require('mocha-eslint');
const lintPaths = ['app/**/*.js', 'ui/**/*.js', '!node_modules/**', '!dist/**', '!docs/**', '!app/scripts/chromereload.js']

const lintOptions = {
  strict: true,
}

lint(lintPaths, lintOptions)