// include JS, TS, JSX, TSX files only in the
// test/e2e
// development/fitness-functions
// development/webpack directories
const E2E_TESTS_REGEX =
  /^(test\/e2e|development\/fitness-functions|development\/webpack).*\.(js|ts|jsx|tsx)$/u;

// include JS and JSX files only in the app, offscreen, shared, and ui directories
const JS_REGEX = /^(app|offscreen|shared|ui)\/.*\.(js|jsx)$/u;

enum AUTOMATION_TYPE {
  CI = 'ci',
  PRE_COMMIT_HOOK = 'pre-commit-hook',
  PRE_PUSH_HOOK = 'pre-push-hook',
}

export { E2E_TESTS_REGEX, JS_REGEX, AUTOMATION_TYPE };
