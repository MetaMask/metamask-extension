import * as path from 'path';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
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
  StepRecordBuild,
} from './types';
import {
  generateFilesafeTimestamp,
  isSensitiveField,
  SENSITIVE_FIELD_PATTERNS,
} from './types';
import type { ExtensionState } from '../types';

const KNOWLEDGE_ROOT = 'test-artifacts/llm-knowledge';
const SCHEMA_VERSION = 1;

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
      if (!metadata) continue;

      if (!this.matchesFilters(metadata, filters)) continue;

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
    if (!filters) return true;

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

    if (!filters) return allIds;

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
    const sessionIds = await this.resolveSessionIds(
      scope,
      currentSessionId,
      filters,
    );

    const matches: { step: StepRecord; score: number }[] = [];
    const queryLower = query.toLowerCase();

    for (const sid of sessionIds) {
      const steps = await this.loadSessionSteps(sid);

      for (const { step } of steps) {
        if (!this.stepMatchesFilters(step, filters)) continue;

        const score = this.computeSearchScore(step, queryLower);
        if (score > 0) {
          matches.push({ step, score });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, limit).map((m) => this.summarizeStep(m.step));
  }

  private stepMatchesFilters(
    step: StepRecord,
    filters?: KnowledgeFilters,
  ): boolean {
    if (!filters) return true;

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

  private summarizeStep(step: StepRecord): KnowledgeStepSummary {
    const screen = step.observation?.state?.currentScreen ?? 'unknown';
    const snippet = this.generateSnippet(step);

    return {
      timestamp: step.timestamp,
      tool: step.tool.name,
      screen,
      snippet,
    };
  }

  private generateSnippet(step: StepRecord): string {
    const parts: string[] = [];

    if (step.tool.target?.testId) {
      parts.push(`testId: ${step.tool.target.testId}`);
    } else if (step.tool.target?.a11yRef) {
      parts.push(`ref: ${step.tool.target.a11yRef}`);
    } else if (step.tool.target?.selector) {
      parts.push(`selector: ${step.tool.target.selector.substring(0, 30)}`);
    }

    if (!step.outcome.ok && step.outcome.error) {
      parts.push(`error: ${step.outcome.error.code}`);
    }

    if (step.observation?.state?.currentScreen) {
      parts.push(`screen: ${step.observation.state.currentScreen}`);
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

  private computeSearchScore(step: StepRecord, query: string): number {
    let score = 0;

    if (step.tool.name.toLowerCase().includes(query)) {
      score += 10;
    }

    if (step.observation?.state?.currentScreen?.toLowerCase().includes(query)) {
      score += 8;
    }

    if (step.tool.target?.testId?.toLowerCase().includes(query)) {
      score += 6;
    }

    for (const testId of step.observation?.testIds ?? []) {
      if (testId.testId.toLowerCase().includes(query)) {
        score += 3;
        break;
      }
    }

    for (const node of step.observation?.a11y?.nodes ?? []) {
      if (
        node.name.toLowerCase().includes(query) ||
        node.role.toLowerCase().includes(query)
      ) {
        score += 2;
        break;
      }
    }

    return score;
  }
}

export function createDefaultObservation(
  state: ExtensionState,
  testIds: TestIdItem[] = [],
  a11yNodes: A11yNodeTrimmed[] = [],
): StepRecordObservation {
  return {
    state,
    testIds,
    a11y: { nodes: a11yNodes },
  };
}

export const knowledgeStore = new KnowledgeStore();
