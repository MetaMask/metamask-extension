import {
  execFileSync,
  type ExecFileSyncOptionsWithStringEncoding,
} from 'child_process';
import fs from 'fs';
import ts from 'typescript';
import { doesDiffModifyFile } from './shared';

const GIT_EXEC_FILE_OPTIONS: ExecFileSyncOptionsWithStringEncoding = {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
  stdio: ['ignore', 'pipe', 'ignore'],
};

/**
 * Checks that changes to the given file within the current PR do not introduce
 * a new member to a API (where a member is, say, a method of a class or a
 * property of an object).
 *
 * This is determined by checking out two versions of the file — the version at
 * the latest commit (HEAD) and the version at the commit from which the PR was
 * cut (base ref) — then gathering the API members from both and comparing the
 * two. (Although we have a diff, it does not give us enough context to know
 * whether an added line falls within the API; we only use it as a heuristic to
 * determine whether the API was changed at all.)
 *
 * @param options - The options.
 * @param options.diff - The diff from the current PR to inspect, used to skip
 * this check if the file was not changed.
 * @param options.filePath - The repository-relative path of the file containing
 * the API.
 * @param options.getMemberNames - Function that extracts the names of the API's
 * members from the parsed file.
 * @param options.baseRef - The commit the change is based on.
 * @returns True if every member after the change also existed before it.
 */
export function preventNewApiMembers({
  diff,
  filePath,
  getMemberNames,
  baseRef,
}: {
  diff: string;
  filePath: string;
  getMemberNames: (sourceFile: ts.SourceFile) => Set<string>;
  baseRef: string;
}): boolean {
  if (!doesDiffModifyFile(diff, filePath)) {
    return true;
  }

  const currentSource = readCurrentFile(filePath);
  const currentMembers = getMemberNames(parseSource(filePath, currentSource));
  const baseSource = readBaseFile(filePath, baseRef);
  const baseMembers =
    baseSource === undefined
      ? new Set<string>()
      : getMemberNames(parseSource(filePath, baseSource));

  return [...currentMembers].every((member) => baseMembers.has(member));
}

/**
 * Reads a file from the working tree. The file is assumed to exist (forcing
 * whatever rules reference this file to be removed when the file is deleted).
 *
 * @param filePath - The repository-relative path of the file.
 * @returns The contents of the file.
 */
function readCurrentFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Attempts to read a file as it exists at the commit the change is based on.
 *
 * The commit is required to exist, but not the file.
 *
 * @param filePath - The repository-relative path of the file.
 * @param baseRef - The commit the change is based on.
 * @returns The contents of the file, or undefined if it does not exist at
 * that commit.
 */
function readBaseFile(filePath: string, baseRef: string): string | undefined {
  if (!doesGitObjectExist(`${baseRef}^{commit}`)) {
    throw new Error(
      `Base commit ${baseRef} is not present in this repository. Make sure it has been fetched.`,
    );
  }

  const objectName = `${baseRef}:${filePath}`;
  if (!doesGitObjectExist(objectName)) {
    return undefined;
  }

  return execFileSync('git', ['show', objectName], GIT_EXEC_FILE_OPTIONS);
}

/**
 * Determines whether the Git repository has the given object name.
 *
 * @param objectName - The name of the Git object to check.
 * @returns True if the object is present, false otherwise.
 */
function doesGitObjectExist(objectName: string): boolean {
  try {
    execFileSync('git', ['cat-file', '-e', objectName], GIT_EXEC_FILE_OPTIONS);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses the given file using TypeScript, so that API members can be read from
 * by analyzing the source code.
 *
 * This only parses the file (no type-checking), so compiler options from
 * `tsconfig.json` do not apply.
 *
 * @param filePath - The path of the file to parse. TypeScript uses its
 * extension to determine whether the file is TypeScript or JavaScript.
 * @param source - The content of the file.
 * @returns The parsed source file.
 */
function parseSource(filePath: string, source: string): ts.SourceFile {
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest);
}
