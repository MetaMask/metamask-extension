/**
 * Stub for `.css` imports in Jest, wired up via `moduleNameMapper` in
 * `jest.config.js`.
 *
 * Some stylesheets are imported as text (`css-loader` with
 * `exportType: 'string'`) so a content script can inject them into a host page.
 * Webpack turns those imports into a string at build time; Jest has no Webpack,
 * so it resolves the `.css` file on disk and tries to execute it as JavaScript,
 * failing on the first selector with "Jest encountered an unexpected token".
 *
 * `moduleNameMapper` only accepts file paths, so the empty string has to live in
 * a module rather than inline in the config.
 */
export default '';
