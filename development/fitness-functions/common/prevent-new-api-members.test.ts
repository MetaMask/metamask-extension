import ts from 'typescript';
import { preventNewApiMembers } from './prevent-new-api-members';
import { withinTemporaryGitRepository } from './temporary-git-repository';
import { generateModifyFilesDiff } from './test-data';

describe('preventNewApiMembers', () => {
  it('passes without reading the base commit when the diff does not modify the file', () => {
    const result = preventNewApiMembers({
      diff: generateModifyFilesDiff('other.ts'),
      filePath: 'api.ts',
      getMemberNames: getFunctionNames,
      baseRef: 'commit-which-does-not-exist',
    });

    expect(result).toBe(true);
  });

  it('rejects a member which did not exist at the base commit', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: 'api.ts',
        baseContents: 'function existing() {}',
        currentContents: 'function existing() {}\nfunction added() {}',
      });

      const result = preventNewApiMembers({
        diff: generateModifyFilesDiff('api.ts'),
        filePath: 'api.ts',
        getMemberNames: getFunctionNames,
        baseRef,
      });

      expect(result).toBe(false);
    });
  });

  it('passes when every current member existed at the base commit', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: 'api.ts',
        baseContents: 'function kept() {}\nfunction removed() {}',
        currentContents: 'function kept() { return 1; }',
      });

      const result = preventNewApiMembers({
        diff: generateModifyFilesDiff('api.ts'),
        filePath: 'api.ts',
        getMemberNames: getFunctionNames,
        baseRef,
      });

      expect(result).toBe(true);
    });
  });

  it('compares against the base commit rather than the latest commit', async () => {
    await withinTemporaryGitRepository(({ writeFile, commitAllFiles }) => {
      writeFile('api.ts', 'function first() {}\nfunction second() {}');
      const baseRef = commitAllFiles();
      writeFile('api.ts', 'function first() {}');
      commitAllFiles();
      writeFile('api.ts', 'function first() {}\nfunction second() {}');

      const result = preventNewApiMembers({
        diff: generateModifyFilesDiff('api.ts'),
        filePath: 'api.ts',
        getMemberNames: getFunctionNames,
        baseRef,
      });

      expect(result).toBe(true);
    });
  });

  it('rejects the members of a file which did not exist at the base commit', async () => {
    await withinTemporaryGitRepository(({ writeFile, commitAllFiles }) => {
      const baseRef = commitAllFiles();
      writeFile('api.ts', 'function added() {}');

      const result = preventNewApiMembers({
        diff: generateModifyFilesDiff('api.ts'),
        filePath: 'api.ts',
        getMemberNames: getFunctionNames,
        baseRef,
      });

      expect(result).toBe(false);
    });
  });

  it('throws when the base commit is not present in the repository', async () => {
    await withinTemporaryGitRepository(({ writeFile, commitAllFiles }) => {
      writeFile('api.ts', 'function existing() {}');
      commitAllFiles();
      const missingCommitSha = '0123456789abcdef0123456789abcdef01234567';

      expect(() =>
        preventNewApiMembers({
          diff: generateModifyFilesDiff('api.ts'),
          filePath: 'api.ts',
          getMemberNames: getFunctionNames,
          baseRef: missingCommitSha,
        }),
      ).toThrow(
        `Base commit ${missingCommitSha} is not present in this repository. Make sure it has been fetched.`,
      );
    });
  });
});

function getFunctionNames(sourceFile: ts.SourceFile): Set<string> {
  return new Set(
    sourceFile.statements
      .filter(ts.isFunctionDeclaration)
      .flatMap((statement) => (statement.name ? [statement.name.text] : [])),
  );
}
