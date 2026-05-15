import path from 'node:path';

export const DEFAULT_TRIALS = 3;
export const DEFAULT_MODEL = 'claude-sonnet-4-6';
export const DEFAULT_MAX_TURNS = 50;
export const DEFAULT_MAX_WALLCLOCK_MS = 10 * 60 * 1000;
export const DEFAULT_JUDGE_MODEL = 'claude-opus-4-7';
export const DEFAULT_SERVICE_NAME = 'metamask-visual-testing-eval';
export const DEFAULT_SCENARIO = 'rename-happy-path';

export const ARTIFACTS_BASE_DIR = path.join(
  'test-artifacts',
  'agent-evals',
  'visual-testing',
);

export const KNOWLEDGE_DIR = path.join('test-artifacts', 'llm-knowledge');

export const DISALLOWED_LIFECYCLE_PATTERNS = [
  'Bash(mm launch*)',
  'Bash(mm cleanup*)',
  'Bash(mm shutdown*)',
];

export const DISALLOWED_KNOWLEDGE_PATTERNS = [
  'Bash(mm knowledge-search*)',
  'Bash(mm knowledge-last*)',
  'Bash(mm knowledge-sessions*)',
];

export const DEFAULT_ALLOWED_TOOLS = [
  'Bash(*)',
  'Read(*)',
  'Write(*)',
  'Edit(*)',
  'MultiEdit(*)',
  'Glob(*)',
  'Grep(*)',
  'WebFetch(*)',
];

export const SKILL_MD_PATH = path.join(
  '.claude',
  'skills',
  'metamask-visual-testing',
  'SKILL.md',
);
