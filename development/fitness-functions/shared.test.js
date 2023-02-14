const {
  EXCLUDE_E2E_TESTS_REGEX,
  filterDiffAdditions,
  hasNumberOfCodeBlocksIncreased,
  filterDiffByFilePath,
} = require('./shared');

const generateCreateFileDiff = (filePath, content) => `
diff --git a/${filePath} b/${filePath}
new file mode 100644
index 000000000..30d74d258
--- /dev/null
+++ b/${filePath}
@@ -0,0 +1 @@
+${content}
`;

const generateModifyFilesDiff = (filePath, addition, removal) => `
diff --git a/${filePath} b/${filePath}
index 57d5de75c..808d8ba37 100644
--- a/${filePath}
+++ b/${filePath}
@@ -1,3 +1,8 @@
+${addition}
@@ -34,33 +39,4 @@
-${removal}
`;

describe('filterDiffAdditions()', () => {
  it('should return code additions in the diff', () => {
    const testFilePath = 'new-file.js';
    const testAddition = 'foo';
    const testFileDiff = generateCreateFileDiff(testFilePath, testAddition);

    const actualResult = filterDiffAdditions(testFileDiff);
    const expectedResult = `+${testAddition}`;

    expect(actualResult).toStrictEqual(expectedResult);
  });
});

describe('hasNumberOfCodeBlocksIncreased()', () => {
  it('should show which code blocks have increased', () => {
    const testDiffFragment = `
    +foo
    +bar
    +baz`;
    const testCodeBlocks = ['code block 1', 'foo', 'baz'];

    const actualResult = hasNumberOfCodeBlocksIncreased(
      testDiffFragment,
      testCodeBlocks,
    );
    const expectedResult = { 'code block 1': false, foo: true, baz: true };

    expect(actualResult).toStrictEqual(expectedResult);
  });
});

describe('filterDiffByFilePath()', () => {
  const testFileDiff = [
    generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
    generateModifyFilesDiff('old-file.js', 'ping', 'pong'),
    generateModifyFilesDiff('old-file.jsx', 'yin', 'yang'),
  ].join('');

  it('should return the right diff for a generic matcher', () => {
    const actualResult = filterDiffByFilePath(
      testFileDiff,
      '.*/.*.(js|ts)$|.*.(js|ts)$',
    );

    expect(actualResult).toMatchInlineSnapshot(`
      "diff --git a/new-file.ts b/new-file.ts
      index 57d5de75c..808d8ba37 100644
      --- a/new-file.ts
      +++ b/new-file.ts
      @@ -1,3 +1,8 @@
      +foo
      @@ -34,33 +39,4 @@
      -bar
      diff --git a/old-file.js b/old-file.js
      index 57d5de75c..808d8ba37 100644
      --- a/old-file.js
      +++ b/old-file.js
      @@ -1,3 +1,8 @@
      +ping
      @@ -34,33 +39,4 @@
      -pong"
    `);
  });

  it('should return the right diff for a specific file in any dir matcher', () => {
    const actualResult = filterDiffByFilePath(testFileDiff, '.*old-file.js$');

    expect(actualResult).toMatchInlineSnapshot(`
      "diff --git a/old-file.js b/old-file.js
      index 57d5de75c..808d8ba37 100644
      --- a/old-file.js
      +++ b/old-file.js
      @@ -1,3 +1,8 @@
      +ping
      @@ -34,33 +39,4 @@
      -pong"
    `);
  });

  it('should return the right diff for a multiple file extension (OR) matcher', () => {
    const actualResult = filterDiffByFilePath(
      testFileDiff,
      '^(./)*old-file.(js|ts|jsx)$',
    );

    expect(actualResult).toMatchInlineSnapshot(`
      "diff --git a/old-file.js b/old-file.js
      index 57d5de75c..808d8ba37 100644
      --- a/old-file.js
      +++ b/old-file.js
      @@ -1,3 +1,8 @@
      +ping
      @@ -34,33 +39,4 @@
      -pong
      diff --git a/old-file.jsx b/old-file.jsx
      index 57d5de75c..808d8ba37 100644
      --- a/old-file.jsx
      +++ b/old-file.jsx
      @@ -1,3 +1,8 @@
      +yin
      @@ -34,33 +39,4 @@
      -yang"
    `);
  });

  it('should return the right diff for a file name negation matcher', () => {
    const actualResult = filterDiffByFilePath(
      testFileDiff,
      '^(?!.*old-file.js$).*.[a-zA-Z]+$',
    );

    expect(actualResult).toMatchInlineSnapshot(`
      "diff --git a/new-file.ts b/new-file.ts
      index 57d5de75c..808d8ba37 100644
      --- a/new-file.ts
      +++ b/new-file.ts
      @@ -1,3 +1,8 @@
      +foo
      @@ -34,33 +39,4 @@
      -bar
      diff --git a/old-file.jsx b/old-file.jsx
      index 57d5de75c..808d8ba37 100644
      --- a/old-file.jsx
      +++ b/old-file.jsx
      @@ -1,3 +1,8 @@
      +yin
      @@ -34,33 +39,4 @@
      -yang"
    `);
  });
});

describe(`EXCLUDE_E2E_TESTS_REGEX "${EXCLUDE_E2E_TESTS_REGEX}"`, () => {
  const PATHS_IT_SHOULD_MATCH = [
    'file.js',
    'path/file.js',
    'much/longer/path/file.js',
    'file.ts',
    'path/file.ts',
    'much/longer/path/file.ts',
    'file.jsx',
    'path/file.jsx',
    'much/longer/path/file.jsx',
  ];

  const PATHS_IT_SHOULD_NOT_MATCH = [
    'test/e2e/file',
    'test/e2e/file.extension',
    'test/e2e/path/file.extension',
    'test/e2e/much/longer/path/file.extension',
    'test/e2e/file.js',
    'test/e2e/path/file.ts',
    'test/e2e/much/longer/path/file.jsx',
    'file',
    'file.extension',
    'path/file.extension',
    'much/longer/path/file.extension',
  ];

  describe('included paths', () => {
    PATHS_IT_SHOULD_MATCH.forEach((path) => {
      it(`should match "${path}"`, () => {
        const result = new RegExp(EXCLUDE_E2E_TESTS_REGEX, 'u').test(path);

        expect(result).toStrictEqual(true);
      });
    });
  });

  describe('excluded paths', () => {
    PATHS_IT_SHOULD_NOT_MATCH.forEach((path) => {
      it(`should not match "${path}"`, () => {
        const result = new RegExp(EXCLUDE_E2E_TESTS_REGEX, 'u').test(path);

        expect(result).toStrictEqual(false);
      });
    });
  });
});
