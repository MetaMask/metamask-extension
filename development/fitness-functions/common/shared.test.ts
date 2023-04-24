import {
  filterDiffLineAdditions,
  hasNumberOfCodeBlocksIncreased,
  filterDiffByFilePath,
  filterDiffFileCreations,
} from './shared';
import { generateCreateFileDiff, generateModifyFilesDiff } from './test-data';

describe('filterDiffLineAdditions()', (): void => {
  it('should return code additions in the diff', (): void => {
    const testFilePath = 'new-file.js';
    const testAddition = 'foo';
    const testFileDiff = generateCreateFileDiff(testFilePath, testAddition);

    const actualResult = filterDiffLineAdditions(testFileDiff);
    const expectedResult = `+${testAddition}`;

    expect(actualResult).toStrictEqual(expectedResult);
  });
});

describe('filterDiffFileCreations()', (): void => {
  it('should return code additions in the diff', (): void => {
    const testFileDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateCreateFileDiff('old-file.js', 'ping'),
      generateModifyFilesDiff('old-file.jsx', 'yin', 'yang'),
    ].join('');

    const actualResult = filterDiffFileCreations(testFileDiff);

    expect(actualResult).toMatchInlineSnapshot(`
      "diff --git a/old-file.js b/old-file.js
      new file mode 100644
      index 000000000..30d74d258
      --- /dev/null
      +++ b/old-file.js
      @@ -0,0 +1 @@
      +ping"
    `);
  });
});

describe('hasNumberOfCodeBlocksIncreased()', (): void => {
  it('should show which code blocks have increased', (): void => {
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

describe('filterDiffByFilePath()', (): void => {
  const testFileDiff = [
    generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
    generateModifyFilesDiff('old-file.js', 'ping', 'pong'),
    generateModifyFilesDiff('old-file.jsx', 'yin', 'yang'),
  ].join('');

  it('should return the right diff for a generic matcher', (): void => {
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

  it('should return the right diff for a specific file in any dir matcher', (): void => {
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

  it('should return the right diff for a multiple file extension (OR) matcher', (): void => {
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

  it('should return the right diff for a file name negation matcher', (): void => {
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
