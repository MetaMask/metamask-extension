import type { ManifestFlags } from '../../shared/lib/manifestFlags';
/**
 * Get any manifest flags found in the PR body and git message.
 *
 * @returns Any manifest flags found
 */
export declare function fetchManifestFlagsFromPRAndGit(): Promise<ManifestFlags>;
