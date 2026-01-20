import * as path from 'path';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import type { ExtensionState } from '../types';
import type {
  StepRecord,
  StepRecordTool,
  StepRecordObservation,
  StepRecordOutcome,
  TestIdItem,
  A11yNodeTrimmed,
  KnowledgeStepSummary,
  RecipeStep,
  SessionMetadata,
  KnowledgeScope,
  KnowledgeFilters,
  SessionSummary,
  StepRecordGit,
  PriorKnowledgeV1,
  PriorKnowledgeContext,
  PriorKnowledgeSimilarStep,
  PriorKnowledgeSuggestedAction,
  PriorKnowledgeAvoid,
  PriorKnowledgeRelatedSession,
  PriorKnowledgeTarget,
} from './types';
import {
  generateFilesafeTimestamp,
  isSensitiveField,
  SENSITIVE_FIELD_PATTERNS,
} from './types';

const KNOWLEDGE_ROOT = 'test-artifacts/llm-knowledge';
const SCHEMA_VERSION = 1;

// =============================================================================
// Tokenization Utilities (SPEC-03)
// =============================================================================

/**
 * Stopwords to remove from queries.
 * Includes common English stopwords and test-specific terms.
 */
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'from',
  'in',
  'on',
  'at',
  'for',
  'with',
  'and',
  'or',
  'but',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'flow',
  'test',
  'should',
  'can',
  'will',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'this',
  'that',
  'these',
  'those',
  'it',
  // Tool-specific stopwords - too generic and match everything
  'mm',
  'mcp',
]);

const MIN_TOKEN_LENGTH = 2;

/**
 * Tokenizes a string into searchable tokens.
 * - Lowercases all text
 * - Splits on non-alphanumeric characters
 * - Removes stopwords and short tokens
 * - Deduplicates tokens
 *
 * @param text - The text to tokenize
 * @returns Array of unique, meaningful tokens
 * @example
 * tokenize('send flow ETH to another account')
 * // Returns: ['send', 'eth', 'another', 'account']
 */
function tokenize(text: string): string[] {
  if (!text) {
    return [];
  }

  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/iu)
    .filter(
      (token) => token.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(token),
    );

  return [...new Set(tokens)];
}

/**
 * Tokenizes an identifier (testId, CSS class, etc.) into words.
 * Handles kebab-case, camelCase, snake_case, and mixed formats.
 *
 * @param identifier - The identifier to tokenize
 * @returns Array of tokens
 * @example
 * tokenizeIdentifier('coin-overview-send-button')
 * // Returns: ['coin', 'overview', 'send', 'button']
 * @example
 * tokenizeIdentifier('sendTokenButton')
 * // Returns: ['send', 'token', 'button']
 * @example
 * tokenizeIdentifier('send_token_btn')
 * // Returns: ['send', 'token', 'btn']
 */
function tokenizeIdentifier(identifier: string): string[] {
  if (!identifier) {
    return [];
  }

  // Split camelCase: 'sendToken' → 'send Token'
  const withSpaces = identifier
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1 $2');

  // Split on non-alphanumeric (handles kebab-case, snake_case)
  const tokens = withSpaces
    .toLowerCase()
    .split(/[^a-z0-9]+/iu)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

  return [...new Set(tokens)];
}

/**
 * Synonyms for common MetaMask actions.
 * Maps user terms to related terms found in testIds/a11y names.
 *
 * Keep this minimal - only add proven high-value mappings.
 * Adding too many synonyms increases noise in search results.
 */
const ACTION_SYNONYMS: Record<string, string[]> = {
  // Transaction actions
  send: ['transfer', 'pay'],
  receive: ['deposit'],

  // Confirmation actions
  approve: ['confirm', 'accept', 'allow'],
  reject: ['deny', 'cancel', 'decline'],

  // Authentication
  unlock: ['login', 'signin'],

  // Connection
  connect: ['link', 'authorize'],

  // Trading
  swap: ['exchange', 'trade'],

  // Signing
  sign: ['signature'],
};

/**
 * Expands query tokens with synonyms.
 * Returns original tokens plus any synonyms for bidirectional matching.
 *
 * @param tokens - Array of query tokens
 * @returns Expanded array including synonyms
 * @example
 * expandWithSynonyms(['transfer'])
 * // Returns: ['transfer', 'send', 'pay']
 */
function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    // Check if token is a canonical term (key)
    if (ACTION_SYNONYMS[token]) {
      for (const synonym of ACTION_SYNONYMS[token]) {
        expanded.add(synonym);
      }
    }

    // Check if token is a synonym value
    for (const [canonical, synonyms] of Object.entries(ACTION_SYNONYMS)) {
      if (synonyms.includes(token)) {
        expanded.add(canonical);
        for (const synonym of synonyms) {
          expanded.add(synonym);
        }
      }
    }
  }

  return [...expanded];
}

const PRIOR_KNOWLEDGE_CONFIG = {
  windowHours: 48,
  maxRelatedSessions: 5,
  maxSimilarSteps: 10,
  maxSuggestedActions: 5,
  maxAvoid: 5,
  minAvoidFailureCount: 2,
} as const;

const SIMILARITY_WEIGHTS = {
  sameScreen: 8,
  urlPathOverlap: 6,
  testIdOverlap: 3,
  a11yOverlap: 2,
  actionableTool: 2,
} as const;

const ACTIONABLE_TOOLS = [
  'mm_click',
  'mm_type',
  'mm_wait_for',
  'mm_navigate',
  'mm_wait_for_notification',
];

const DISCOVERY_TOOLS = [
  'mm_describe_screen',
  'mm_list_testids',
  'mm_accessibility_snapshot',
  'mm_get_state',
];

function extractPathTokens(url: string): string[] {
  try {
    const hashPart = url.split('#')[1] ?? '';
    return hashPart
      .split('/')
      .filter((t) => t.length > 0 && !t.startsWith('0x'));
  } catch {
    return [];
  }
}

export class KnowledgeStore {
  private knowledgeRoot: string;

  private sessionMetadataCache: Map<string, SessionMetadata | null> = new Map();

  constructor(rootDir?: string) {
    this.knowledgeRoot = rootDir ?? path.join(process.cwd(), KNOWLEDGE_ROOT);
  }

  async writeSessionMetadata(metadata: SessionMetadata): Promise<string> {
    const sessionDir = path.join(this.knowledgeRoot, metadata.sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    const filepath = path.join(sessionDir, 'session.json');
    await fs.writeFile(filepath, JSON.stringify(metadata, null, 2));

    this.sessionMetadataCache.set(metadata.sessionId, metadata);

    return filepath;
  }

  async readSessionMetadata(
    sessionId: string,
  ): Promise<SessionMetadata | null> {
    if (this.sessionMetadataCache.has(sessionId)) {
      return this.sessionMetadataCache.get(sessionId) ?? null;
    }

    const filepath = path.join(this.knowledgeRoot, sessionId, 'session.json');

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const metadata = JSON.parse(content) as SessionMetadata;
      this.sessionMetadataCache.set(sessionId, metadata);
      return metadata;
    } catch {
      this.sessionMetadataCache.set(sessionId, null);
      return null;
    }
  }

  async listSessions(
    limit: number,
    filters?: KnowledgeFilters,
  ): Promise<SessionSummary[]> {
    const sessionIds = await this.getAllSessionIds();
    const sessions: { metadata: SessionMetadata; createdAt: Date }[] = [];

    for (const sid of sessionIds) {
      const metadata = await this.readSessionMetadata(sid);
      if (!metadata) {
        continue;
      }

      if (!this.matchesFilters(metadata, filters)) {
        continue;
      }

      sessions.push({
        metadata,
        createdAt: new Date(metadata.createdAt),
      });
    }

    sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return sessions.slice(0, limit).map((s) => ({
      sessionId: s.metadata.sessionId,
      createdAt: s.metadata.createdAt,
      goal: s.metadata.goal,
      flowTags: s.metadata.flowTags,
      tags: s.metadata.tags,
      git: s.metadata.git
        ? { branch: s.metadata.git.branch, commit: s.metadata.git.commit }
        : undefined,
    }));
  }

  private matchesFilters(
    metadata: SessionMetadata,
    filters?: KnowledgeFilters,
  ): boolean {
    if (!filters) {
      return true;
    }

    if (filters.flowTag && !metadata.flowTags.includes(filters.flowTag)) {
      return false;
    }

    if (filters.tag && !metadata.tags.includes(filters.tag)) {
      return false;
    }

    if (filters.gitBranch && metadata.git?.branch !== filters.gitBranch) {
      return false;
    }

    if (filters.sinceHours) {
      const cutoff = Date.now() - filters.sinceHours * 60 * 60 * 1000;
      const createdAt = new Date(metadata.createdAt).getTime();
      if (createdAt < cutoff) {
        return false;
      }
    }

    return true;
  }

  async resolveSessionIds(
    scope: KnowledgeScope,
    currentSessionId: string | undefined,
    filters?: KnowledgeFilters,
  ): Promise<string[]> {
    if (scope === 'current') {
      return currentSessionId ? [currentSessionId] : [];
    }

    if (typeof scope === 'object' && 'sessionId' in scope) {
      return [scope.sessionId];
    }

    const allIds = await this.getAllSessionIds();

    if (!filters) {
      return allIds;
    }

    const filtered: string[] = [];
    for (const sid of allIds) {
      const metadata = await this.readSessionMetadata(sid);
      if (metadata && this.matchesFilters(metadata, filters)) {
        filtered.push(sid);
      } else if (!metadata) {
        filtered.push(sid);
      }
    }

    return filtered;
  }

  async recordStep(params: {
    sessionId: string;
    toolName: string;
    input?: Record<string, unknown>;
    target?: StepRecordTool['target'];
    outcome: StepRecordOutcome;
    observation: StepRecordObservation;
    durationMs?: number;
    screenshotPath?: string;
    screenshotDimensions?: { width: number; height: number };
  }): Promise<string> {
    const timestamp = new Date();
    const filesafeTimestamp = generateFilesafeTimestamp(timestamp);

    const sessionDir = path.join(this.knowledgeRoot, params.sessionId);
    const stepsDir = path.join(sessionDir, 'steps');
    await fs.mkdir(stepsDir, { recursive: true });

    const sanitizedInput = this.sanitizeInput(params.toolName, params.input);
    const labels = this.computeLabels(
      params.toolName,
      params.target,
      params.outcome,
    );

    const stepRecord: StepRecord = {
      schemaVersion: SCHEMA_VERSION,
      timestamp: timestamp.toISOString(),
      sessionId: params.sessionId,
      environment: this.getEnvironmentInfo(),
      git: this.getGitInfo(),
      tool: {
        name: params.toolName,
        input: sanitizedInput.input,
        target: params.target,
        textRedacted: sanitizedInput.textRedacted,
        textLength: sanitizedInput.textLength,
      },
      timing: {
        durationMs: params.durationMs,
      },
      outcome: params.outcome,
      observation: params.observation,
      labels,
    };

    if (params.screenshotPath) {
      stepRecord.artifacts = {
        screenshot: {
          path: params.screenshotPath,
          width: params.screenshotDimensions?.width,
          height: params.screenshotDimensions?.height,
        },
      };
    }

    const filename = `${filesafeTimestamp}-${params.toolName}.json`;
    const filepath = path.join(stepsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(stepRecord, null, 2));

    return filepath;
  }

  private computeLabels(
    toolName: string,
    target?: StepRecordTool['target'],
    outcome?: StepRecordOutcome,
  ): string[] {
    const labels: string[] = [];

    const discoveryTools = [
      'mm_describe_screen',
      'mm_list_testids',
      'mm_accessibility_snapshot',
      'mm_get_state',
    ];
    const navigationTools = ['mm_navigate', 'mm_wait_for_notification'];
    const interactionTools = ['mm_click', 'mm_type', 'mm_wait_for'];

    if (discoveryTools.includes(toolName)) {
      labels.push('discovery');
    } else if (navigationTools.includes(toolName)) {
      labels.push('navigation');
    } else if (interactionTools.includes(toolName)) {
      labels.push('interaction');

      const targetStr = JSON.stringify(target ?? {}).toLowerCase();
      if (
        targetStr.includes('confirm') ||
        targetStr.includes('approve') ||
        targetStr.includes('submit')
      ) {
        labels.push('confirmation');
      }
    }

    if (outcome && !outcome.ok) {
      labels.push('error-recovery');
    }

    return labels;
  }

  async getLastSteps(
    n: number,
    scope: KnowledgeScope,
    currentSessionId: string | undefined,
    filters?: KnowledgeFilters,
  ): Promise<KnowledgeStepSummary[]> {
    const sessionIds = await this.resolveSessionIds(
      scope,
      currentSessionId,
      filters,
    );

    const allSteps: { step: StepRecord; filepath: string }[] = [];

    for (const sid of sessionIds) {
      const steps = await this.loadSessionSteps(sid);
      for (const s of steps) {
        if (this.stepMatchesFilters(s.step, filters)) {
          allSteps.push(s);
        }
      }
    }

    allSteps.sort(
      (a, b) =>
        new Date(b.step.timestamp).getTime() -
        new Date(a.step.timestamp).getTime(),
    );

    return allSteps.slice(0, n).map((item) => this.summarizeStep(item.step));
  }

  async searchSteps(
    query: string,
    limit: number,
    scope: KnowledgeScope,
    currentSessionId: string | undefined,
    filters?: KnowledgeFilters,
  ): Promise<KnowledgeStepSummary[]> {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return [];
    }

    const expandedTokens = expandWithSynonyms(queryTokens);

    const sessionIds = await this.resolveSessionIds(
      scope,
      currentSessionId,
      filters,
    );

    type ScoredSession = {
      sessionId: string;
      score: number;
      metadata?: SessionMetadata;
    };
    const scoredSessions: ScoredSession[] = [];

    for (const sid of sessionIds) {
      const metadata = await this.readSessionMetadata(sid);
      const sessionScore = metadata
        ? this.computeSessionScore(metadata, expandedTokens)
        : 0;
      scoredSessions.push({
        sessionId: sid,
        score: sessionScore,
        metadata: metadata ?? undefined,
      });
    }

    scoredSessions.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const aTime = a.metadata?.createdAt
        ? new Date(a.metadata.createdAt).getTime()
        : 0;
      const bTime = b.metadata?.createdAt
        ? new Date(b.metadata.createdAt).getTime()
        : 0;
      if (bTime !== aTime) {
        return bTime - aTime;
      }
      return a.sessionId.localeCompare(b.sessionId);
    });
    const maxCandidateSessions = 20;
    const topSessions = scoredSessions.slice(
      0,
      Math.min(maxCandidateSessions, scoredSessions.length),
    );

    type StepMatch = {
      step: StepRecord;
      score: number;
      sessionScore: number;
      sessionGoal?: string;
      matchedFields: string[];
    };
    const matches: StepMatch[] = [];

    for (const {
      sessionId: sid,
      score: sessionScore,
      metadata,
    } of topSessions) {
      const steps = await this.loadSessionSteps(sid);

      for (const { step } of steps) {
        if (!this.stepMatchesFilters(step, filters)) {
          continue;
        }

        const { score: stepScore, matchedFields } = this.computeSearchScore(
          step,
          expandedTokens,
        );

        const combinedScore = sessionScore + stepScore;

        if (combinedScore > 0) {
          matches.push({
            step,
            score: combinedScore,
            sessionScore,
            sessionGoal: metadata?.goal,
            matchedFields,
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);

    return matches
      .slice(0, limit)
      .map((m) => this.summarizeStep(m.step, m.matchedFields, m.sessionGoal));
  }

  private stepMatchesFilters(
    step: StepRecord,
    filters?: KnowledgeFilters,
  ): boolean {
    if (!filters) {
      return true;
    }

    if (
      filters.screen &&
      step.observation?.state?.currentScreen !== filters.screen
    ) {
      return false;
    }

    return true;
  }

  async summarizeSession(sessionId: string): Promise<{
    sessionId: string;
    stepCount: number;
    recipe: RecipeStep[];
  }> {
    const steps = await this.loadSessionSteps(sessionId);

    steps.sort(
      (a, b) =>
        new Date(a.step.timestamp).getTime() -
        new Date(b.step.timestamp).getTime(),
    );

    const recipe: RecipeStep[] = steps.map(({ step }, index) => ({
      stepNumber: index + 1,
      tool: step.tool.name,
      notes: this.generateStepNotes(step),
    }));

    return {
      sessionId,
      stepCount: steps.length,
      recipe,
    };
  }

  async saveScreenshot(
    sessionId: string,
    name: string,
    buffer: Buffer,
  ): Promise<string> {
    const screenshotsDir = path.join(
      this.knowledgeRoot,
      sessionId,
      'screenshots',
    );
    await fs.mkdir(screenshotsDir, { recursive: true });

    const timestamp = generateFilesafeTimestamp();
    const filename = `${timestamp}-${name}.png`;
    const filepath = path.join(screenshotsDir, filename);

    await fs.writeFile(filepath, buffer);

    return filepath;
  }

  async getAllSessionIds(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.knowledgeRoot, {
        withFileTypes: true,
      });
      return entries
        .filter((e) => e.isDirectory() && e.name.startsWith('mm-'))
        .map((e) => e.name);
    } catch {
      return [];
    }
  }

  getGitInfoSync(): StepRecordGit {
    return this.getGitInfo();
  }

  private async loadSessionSteps(
    sessionId: string,
  ): Promise<{ step: StepRecord; filepath: string }[]> {
    const stepsDir = path.join(this.knowledgeRoot, sessionId, 'steps');

    try {
      const files = await fs.readdir(stepsDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const steps: { step: StepRecord; filepath: string }[] = [];

      for (const file of jsonFiles) {
        const filepath = path.join(stepsDir, file);
        try {
          const content = await fs.readFile(filepath, 'utf-8');
          const step = JSON.parse(content) as StepRecord;
          steps.push({ step, filepath });
        } catch {
          continue;
        }
      }

      return steps;
    } catch {
      return [];
    }
  }

  private sanitizeInput(
    toolName: string,
    input?: Record<string, unknown>,
  ): {
    input?: Record<string, unknown>;
    textRedacted?: boolean;
    textLength?: number;
  } {
    if (!input) {
      return {};
    }

    const sanitized: Record<string, unknown> = {};
    let textRedacted = false;
    let textLength: number | undefined;

    for (const [key, value] of Object.entries(input)) {
      if (toolName === 'mm_type' && key === 'text') {
        const textValue = String(value);
        const targetTestId = input.testId as string | undefined;
        const targetSelector = input.selector as string | undefined;

        const isSensitive =
          isSensitiveField(targetTestId ?? '') ||
          isSensitiveField(targetSelector ?? '') ||
          SENSITIVE_FIELD_PATTERNS.some((p) => p.test(key));

        if (isSensitive) {
          textRedacted = true;
          textLength = textValue.length;
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = value;
        }
      } else if (isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return {
      input: sanitized,
      textRedacted: textRedacted || undefined,
      textLength,
    };
  }

  private getEnvironmentInfo(): { platform: string; nodeVersion: string } {
    return {
      platform: process.platform,
      nodeVersion: process.version,
    };
  }

  private getGitInfo(): { branch?: string; commit?: string; dirty?: boolean } {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();

      const commit = execSync('git rev-parse --short HEAD', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();

      const status = execSync('git status --porcelain', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return {
        branch,
        commit,
        dirty: status.trim().length > 0,
      };
    } catch {
      return {};
    }
  }

  private summarizeStep(
    step: StepRecord,
    matchedFields?: string[],
    sessionGoal?: string,
  ): KnowledgeStepSummary {
    const screen = step.observation?.state?.currentScreen ?? 'unknown';
    const snippet = this.generateSnippet(step, matchedFields);

    return {
      timestamp: step.timestamp,
      tool: step.tool.name,
      screen,
      snippet,
      sessionId: step.sessionId,
      matchedFields: matchedFields?.length ? matchedFields : undefined,
      sessionGoal,
    };
  }

  private generateSnippet(step: StepRecord, matchedFields?: string[]): string {
    const parts: string[] = [];

    if (matchedFields && matchedFields.length > 0) {
      const topMatches = matchedFields.slice(0, 3).join(', ');
      parts.push(`match: ${topMatches}`);
    }

    if (step.tool.target?.testId) {
      parts.push(`testId: ${step.tool.target.testId}`);
    } else if (step.tool.target?.a11yRef) {
      parts.push(`ref: ${step.tool.target.a11yRef}`);
    } else if (step.tool.target?.selector) {
      const shortSelector = step.tool.target.selector.substring(0, 30);
      parts.push(`selector: ${shortSelector}`);
    }

    if (step.labels && step.labels.length > 0) {
      parts.push(`labels: ${step.labels.join(', ')}`);
    }

    if (step.observation?.state?.currentScreen) {
      parts.push(`screen: ${step.observation.state.currentScreen}`);
    }

    if (!step.outcome.ok && step.outcome.error) {
      parts.push(`error: ${step.outcome.error.code}`);
    }

    return parts.join(', ') || step.tool.name;
  }

  private generateStepNotes(step: StepRecord): string {
    const notes: string[] = [];

    if (step.tool.target?.testId) {
      notes.push(`target: [data-testid="${step.tool.target.testId}"]`);
    } else if (step.tool.target?.a11yRef) {
      notes.push(`target: ${step.tool.target.a11yRef}`);
    }

    if (step.observation?.state?.currentScreen) {
      notes.push(`on screen: ${step.observation.state.currentScreen}`);
    }

    if (!step.outcome.ok && step.outcome.error) {
      notes.push(`FAILED: ${step.outcome.error.message}`);
    }

    if (step.artifacts?.screenshot?.path) {
      notes.push('screenshot captured');
    }

    return notes.join('; ') || 'executed';
  }

  private computeSessionScore(
    metadata: SessionMetadata,
    queryTokens: string[],
  ): number {
    let score = 0;

    for (const token of queryTokens) {
      for (const flowTag of metadata.flowTags) {
        if (flowTag.toLowerCase().includes(token)) {
          score += 12;
          break;
        }
      }
    }

    const goalTokens = tokenize(metadata.goal ?? '');
    for (const token of queryTokens) {
      if (goalTokens.includes(token)) {
        score += 6;
      }
    }

    for (const token of queryTokens) {
      for (const tag of metadata.tags) {
        if (tag.toLowerCase().includes(token)) {
          score += 4;
          break;
        }
      }
    }

    if (metadata.git?.branch) {
      const branchTokens = tokenize(metadata.git.branch);
      for (const token of queryTokens) {
        if (branchTokens.includes(token)) {
          score += 2;
          break;
        }
      }
    }

    const ageHours =
      (Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) {
      score += 3;
    } else if (ageHours < 72) {
      score += 1;
    }

    return score;
  }

  private computeSearchScore(
    step: StepRecord,
    queryTokens: string[],
  ): { score: number; matchedFields: string[] } {
    let score = 0;
    const matchedFieldsSet = new Set<string>();
    let matchedTokens = 0;

    const targetTestIdTokens = step.tool.target?.testId
      ? tokenizeIdentifier(step.tool.target.testId)
      : [];

    const observedTestIdTokensMap = new Map<string, string[]>();
    for (const testIdItem of step.observation?.testIds ?? []) {
      observedTestIdTokensMap.set(
        testIdItem.testId,
        tokenizeIdentifier(testIdItem.testId),
      );
    }

    for (const token of queryTokens) {
      let tokenMatched = false;

      if (step.tool.name.toLowerCase().includes(token)) {
        score += 10;
        matchedFieldsSet.add(`tool:${step.tool.name}`);
        tokenMatched = true;
      }

      const screen = step.observation?.state?.currentScreen;
      if (screen?.toLowerCase().includes(token)) {
        score += 8;
        matchedFieldsSet.add(`screen:${screen}`);
        tokenMatched = true;
      }

      if (step.tool.target?.testId && targetTestIdTokens.includes(token)) {
        score += 6;
        matchedFieldsSet.add(`testId:${step.tool.target.testId}`);
        tokenMatched = true;
      }

      for (const label of step.labels ?? []) {
        if (label.toLowerCase().includes(token)) {
          score += 5;
          matchedFieldsSet.add(`label:${label}`);
          tokenMatched = true;
          break;
        }
      }

      for (const [testId, tokens] of observedTestIdTokensMap) {
        if (tokens.includes(token)) {
          score += 3;
          matchedFieldsSet.add(`testId:${testId}`);
          tokenMatched = true;
          break;
        }
      }

      for (const node of step.observation?.a11y?.nodes ?? []) {
        if (node.name.toLowerCase().includes(token)) {
          score += 2;
          matchedFieldsSet.add(`a11y:${node.role}:"${node.name}"`);
          tokenMatched = true;
          break;
        }
        if (node.role.toLowerCase().includes(token)) {
          score += 2;
          matchedFieldsSet.add(`a11y:${node.role}`);
          tokenMatched = true;
          break;
        }
      }

      if (tokenMatched) {
        matchedTokens += 1;
      }
    }

    if (queryTokens.length > 0) {
      const coverageRatio = matchedTokens / queryTokens.length;
      score += Math.floor(coverageRatio * 5);
    }

    return { score, matchedFields: [...matchedFieldsSet] };
  }

  async generatePriorKnowledge(
    context: PriorKnowledgeContext,
    currentSessionId?: string,
  ): Promise<PriorKnowledgeV1 | undefined> {
    const { windowHours } = PRIOR_KNOWLEDGE_CONFIG;

    const filters: KnowledgeFilters = {
      sinceHours: windowHours,
    };

    if (context.currentSessionFlowTags?.length) {
      filters.flowTag = context.currentSessionFlowTags[0];
    }

    const sessionIds = await this.resolveSessionIds('all', undefined, filters);
    const candidateSessionIds = sessionIds.filter(
      (sid) => sid !== currentSessionId,
    );

    if (candidateSessionIds.length === 0) {
      return undefined;
    }

    const relatedSessions = await this.getRelatedSessions(
      candidateSessionIds,
      filters,
      PRIOR_KNOWLEDGE_CONFIG.maxRelatedSessions,
    );

    const { similarSteps, candidateStepCount } = await this.getSimilarSteps(
      context,
      candidateSessionIds,
      filters,
    );

    const suggestedNextActions = this.buildSuggestedActions(
      similarSteps,
      context,
    );

    const avoidList = await this.buildAvoidList(
      context,
      candidateSessionIds,
      filters,
    );

    if (
      relatedSessions.length === 0 &&
      similarSteps.length === 0 &&
      suggestedNextActions.length === 0
    ) {
      return undefined;
    }

    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      query: {
        windowHours,
        usedFlowTags: context.currentSessionFlowTags ?? [],
        usedFilters: filters,
        candidateSessions: candidateSessionIds.length,
        candidateSteps: candidateStepCount,
      },
      relatedSessions,
      similarSteps: similarSteps.slice(
        0,
        PRIOR_KNOWLEDGE_CONFIG.maxSimilarSteps,
      ),
      suggestedNextActions: suggestedNextActions.slice(
        0,
        PRIOR_KNOWLEDGE_CONFIG.maxSuggestedActions,
      ),
      avoid:
        avoidList.length > 0
          ? avoidList.slice(0, PRIOR_KNOWLEDGE_CONFIG.maxAvoid)
          : undefined,
    };
  }

  private async getRelatedSessions(
    sessionIds: string[],
    filters: KnowledgeFilters,
    limit: number,
  ): Promise<PriorKnowledgeRelatedSession[]> {
    const sessions: PriorKnowledgeRelatedSession[] = [];

    for (const sid of sessionIds) {
      if (sessions.length >= limit) {
        break;
      }

      const metadata = await this.readSessionMetadata(sid);
      if (!metadata) {
        continue;
      }

      if (!this.matchesFilters(metadata, filters)) {
        continue;
      }

      sessions.push({
        sessionId: metadata.sessionId,
        createdAt: metadata.createdAt,
        goal: metadata.goal,
        flowTags: metadata.flowTags,
        tags: metadata.tags,
        git: metadata.git
          ? { branch: metadata.git.branch, commit: metadata.git.commit }
          : undefined,
      });
    }

    return sessions;
  }

  private async getSimilarSteps(
    context: PriorKnowledgeContext,
    sessionIds: string[],
    filters: KnowledgeFilters,
  ): Promise<{
    similarSteps: PriorKnowledgeSimilarStep[];
    candidateStepCount: number;
  }> {
    const scoredSteps: { step: StepRecord; score: number }[] = [];
    let candidateStepCount = 0;

    const visibleTestIdSet = new Set(
      context.visibleTestIds.map((t) => t.testId),
    );
    const visibleA11yNames = new Set(
      context.a11yNodes.map((n) => n.name.toLowerCase()),
    );

    for (const sid of sessionIds) {
      const steps = await this.loadSessionSteps(sid);

      for (const { step } of steps) {
        candidateStepCount += 1;

        if (!this.stepMatchesFilters(step, filters)) {
          continue;
        }

        if (DISCOVERY_TOOLS.includes(step.tool.name)) {
          continue;
        }

        const score = this.computeSimilarityScore(
          step,
          context,
          visibleTestIdSet,
          visibleA11yNames,
        );

        if (score > 0) {
          scoredSteps.push({ step, score });
        }
      }
    }

    scoredSteps.sort((a, b) => b.score - a.score);

    const similarSteps: PriorKnowledgeSimilarStep[] = scoredSteps
      .slice(0, PRIOR_KNOWLEDGE_CONFIG.maxSimilarSteps)
      .map(({ step, score }) => {
        const a11yHint = this.lookupA11yHint(step);

        return {
          sessionId: step.sessionId,
          timestamp: step.timestamp,
          tool: step.tool.name,
          screen: step.observation?.state?.currentScreen ?? 'unknown',
          snippet: this.generateSnippet(step),
          labels: step.labels,
          target: step.tool.target
            ? {
                testId: step.tool.target.testId,
                selector: step.tool.target.selector,
              }
            : undefined,
          a11yHint,
          confidence: Math.min(score / 20, 1),
        };
      });

    return { similarSteps, candidateStepCount };
  }

  private lookupA11yHint(
    step: StepRecord,
  ): { role: string; name: string } | undefined {
    const a11yRef = step.tool.target?.a11yRef;
    if (!a11yRef) {
      return undefined;
    }

    const nodes = step.observation?.a11y?.nodes ?? [];
    const matchingNode = nodes.find((node) => node.ref === a11yRef);
    if (!matchingNode?.name) {
      return undefined;
    }

    return { role: matchingNode.role, name: matchingNode.name };
  }

  private computeSimilarityScore(
    step: StepRecord,
    context: PriorKnowledgeContext,
    visibleTestIdSet: Set<string>,
    visibleA11yNames: Set<string>,
  ): number {
    let score = 0;

    const stepScreen = step.observation?.state?.currentScreen;
    const contextScreen = context.currentScreen;

    if (stepScreen === contextScreen && stepScreen !== 'unknown') {
      score += SIMILARITY_WEIGHTS.sameScreen;
    }

    if (context.currentUrl && step.observation?.state) {
      const currentPathTokens = extractPathTokens(context.currentUrl);
      const stepUrl = step.observation.state.currentUrl ?? '';
      const stepPathTokens = extractPathTokens(stepUrl);

      for (const token of currentPathTokens) {
        if (stepPathTokens.includes(token)) {
          score += SIMILARITY_WEIGHTS.urlPathOverlap;
          break;
        }
      }
    }

    let testIdOverlapCount = 0;
    for (const testId of step.observation?.testIds ?? []) {
      if (visibleTestIdSet.has(testId.testId)) {
        testIdOverlapCount += 1;
        if (testIdOverlapCount >= 3) {
          break;
        }
      }
    }
    score += Math.min(testIdOverlapCount, 3) * SIMILARITY_WEIGHTS.testIdOverlap;

    let a11yOverlapCount = 0;
    for (const node of step.observation?.a11y?.nodes ?? []) {
      if (visibleA11yNames.has(node.name.toLowerCase())) {
        a11yOverlapCount += 1;
        if (a11yOverlapCount >= 2) {
          break;
        }
      }
    }
    score += Math.min(a11yOverlapCount, 2) * SIMILARITY_WEIGHTS.a11yOverlap;

    if (ACTIONABLE_TOOLS.includes(step.tool.name)) {
      score += SIMILARITY_WEIGHTS.actionableTool;
    }

    return score;
  }

  private buildSuggestedActions(
    similarSteps: PriorKnowledgeSimilarStep[],
    context: PriorKnowledgeContext,
  ): PriorKnowledgeSuggestedAction[] {
    const visibleTestIdSet = new Set(
      context.visibleTestIds.map((t) => t.testId),
    );
    const visibleA11yMap = new Map(
      context.a11yNodes.map((n) => [n.name.toLowerCase(), n]),
    );

    const actionCounts = new Map<
      string,
      {
        step: PriorKnowledgeSimilarStep;
        count: number;
        confidenceSum: number;
      }
    >();

    for (const step of similarSteps) {
      if (!step.target?.testId && !step.target?.selector) {
        continue;
      }

      const key = step.target.testId ?? step.target.selector ?? '';

      const existing = actionCounts.get(key);
      if (existing) {
        existing.count += 1;
        existing.confidenceSum += step.confidence;
      } else {
        actionCounts.set(key, {
          step,
          count: 1,
          confidenceSum: step.confidence,
        });
      }
    }

    const suggestions: PriorKnowledgeSuggestedAction[] = [];

    const sortedActions = Array.from(actionCounts.entries()).sort(
      ([, a], [, b]) => b.confidenceSum - a.confidenceSum,
    );

    for (const [, { step, count, confidenceSum }] of sortedActions) {
      if (suggestions.length >= PRIOR_KNOWLEDGE_CONFIG.maxSuggestedActions) {
        break;
      }

      const preferredTarget = this.buildPreferredTarget(step, visibleTestIdSet);
      if (!preferredTarget) {
        continue;
      }

      const fallbackTargets = this.buildFallbackTargets(
        preferredTarget,
        visibleA11yMap,
      );

      const action = this.toolToAction(step.tool);
      if (!action) {
        continue;
      }

      suggestions.push({
        rank: suggestions.length + 1,
        action,
        rationale:
          count > 1
            ? `Used ${count} times successfully on this screen`
            : 'Most common next successful step on this screen',
        confidence: Math.min(confidenceSum / count, 1),
        preferredTarget,
        fallbackTargets:
          fallbackTargets.length > 0 ? fallbackTargets : undefined,
      });
    }

    return suggestions;
  }

  private buildPreferredTarget(
    priorStep: PriorKnowledgeSimilarStep,
    visibleTestIdSet: Set<string>,
  ): PriorKnowledgeTarget | null {
    if (
      priorStep.target?.testId &&
      visibleTestIdSet.has(priorStep.target.testId)
    ) {
      return { type: 'testId', value: priorStep.target.testId };
    }

    if (priorStep.target?.selector) {
      return { type: 'selector', value: priorStep.target.selector };
    }

    if (priorStep.a11yHint) {
      return { type: 'a11yHint', value: priorStep.a11yHint };
    }

    return null;
  }

  private buildFallbackTargets(
    preferredTarget: PriorKnowledgeTarget,
    visibleA11yMap: Map<string, A11yNodeTrimmed>,
  ): PriorKnowledgeTarget[] {
    const fallbacks: PriorKnowledgeTarget[] = [];

    if (preferredTarget.type === 'testId') {
      const testId = preferredTarget.value;

      const entries = Array.from(visibleA11yMap.entries());
      for (const [name, node] of entries) {
        if (
          name.includes(testId.replace(/-/gu, ' ').toLowerCase()) ||
          testId.toLowerCase().includes(name)
        ) {
          fallbacks.push({
            type: 'a11yHint',
            value: { role: node.role, name: node.name },
          });
          break;
        }
      }
    }

    return fallbacks;
  }

  private toolToAction(
    toolName: string,
  ): PriorKnowledgeSuggestedAction['action'] | null {
    if (toolName === 'mm_click') {
      return 'click';
    }
    if (toolName === 'mm_type') {
      return 'type';
    }
    if (toolName === 'mm_wait_for') {
      return 'wait_for';
    }
    if (toolName === 'mm_navigate') {
      return 'navigate';
    }
    if (toolName === 'mm_wait_for_notification') {
      return 'wait_for_notification';
    }
    return null;
  }

  private async buildAvoidList(
    context: PriorKnowledgeContext,
    sessionIds: string[],
    _filters: KnowledgeFilters,
  ): Promise<PriorKnowledgeAvoid[]> {
    const failureCounts = new Map<
      string,
      { errorCode?: string; selector?: string; testId?: string; count: number }
    >();

    for (const sid of sessionIds) {
      const steps = await this.loadSessionSteps(sid);

      for (const { step } of steps) {
        if (step.outcome.ok) {
          continue;
        }
        if (step.observation?.state?.currentScreen !== context.currentScreen) {
          continue;
        }

        const targetKey =
          step.tool.target?.testId ?? step.tool.target?.selector ?? 'unknown';

        const existing = failureCounts.get(targetKey);
        if (existing) {
          existing.count += 1;
        } else {
          failureCounts.set(targetKey, {
            errorCode: step.outcome.error?.code,
            testId: step.tool.target?.testId,
            selector: step.tool.target?.selector,
            count: 1,
          });
        }
      }
    }

    const avoidList: PriorKnowledgeAvoid[] = [];

    const failureEntries = Array.from(failureCounts.values());
    for (const failure of failureEntries) {
      if (failure.count < PRIOR_KNOWLEDGE_CONFIG.minAvoidFailureCount) {
        continue;
      }

      avoidList.push({
        rationale: 'Frequently fails due to UI churn',
        target: {
          testId: failure.testId,
          selector: failure.selector,
        },
        errorCode: failure.errorCode,
        frequency: failure.count,
      });
    }

    avoidList.sort((a, b) => b.frequency - a.frequency);

    return avoidList;
  }
}

export function createDefaultObservation(
  state: ExtensionState,
  testIds: TestIdItem[] = [],
  a11yNodes: A11yNodeTrimmed[] = [],
  priorKnowledge?: PriorKnowledgeV1,
): StepRecordObservation {
  const observation: StepRecordObservation = {
    state,
    testIds,
    a11y: { nodes: a11yNodes },
  };

  if (priorKnowledge) {
    observation.priorKnowledge = priorKnowledge;
  }

  return observation;
}

export const knowledgeStore = new KnowledgeStore();

export { tokenize, tokenizeIdentifier, expandWithSynonyms };
