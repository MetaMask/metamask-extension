import { execSync } from 'child_process';

/** Gets current git commit hash, or 'unknown' if unavailable. */
export function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** Gets current git branch name, or 'local' if unavailable. */
export function getGitBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch {
    return 'local';
  }
}

