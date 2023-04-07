// include JS, TS, JSX, TSX files only excluding files in the e2e tests and
// fitness functions directories
const EXCLUDE_E2E_TESTS_REGEX =
  '^(?!test/e2e)(?!development/fitness).*.(js|ts|jsx|tsx)$';

// include JS and JSX files in the shared directory only
const SHARED_FOLDER_JS_REGEX = '^(shared).*.(js|jsx)$';

enum AUTOMATION_TYPE {
  CI = 'ci',
  PRE_COMMIT_HOOK = 'pre-commit-hook',
  PRE_PUSH_HOOK = 'pre-push-hook',
}

export { EXCLUDE_E2E_TESTS_REGEX, SHARED_FOLDER_JS_REGEX, AUTOMATION_TYPE };
