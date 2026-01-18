# SPEC-03 — Knowledge Search Improvements (Tokenized Search + Session Ranking)

This spec defines improvements to `mm_knowledge_search` to enhance discoverability of prior sessions and steps. The goal is to minimize agent learning time when visually validating UI scenarios while maintaining resilience to codebase changes.

This document is implementation-oriented so another agent can implement it.

---

## 1) Background

### 1.1 Current Problem

The `mm_knowledge_search` tool uses **exact substring matching** against step fields. This causes several issues:

1. **Natural language queries fail**: Searching `"send flow ETH to another account"` returns no results because no field contains that exact substring.

2. **Session metadata is ignored**: Session-level data (`goal`, `flowTags`, `tags`) is not searched, even though users describe goals at the session level.

3. **Brittle identifier matching**: TestIds like `coin-overview-send-button` are treated as opaque strings. Searching for `"send"` may not match depending on substring position.

### 1.2 Evidence

| Query                                | Expected                      | Actual                         |
| ------------------------------------ | ----------------------------- | ------------------------------ |
| `"send flow ETH to another account"` | Find send flow sessions       | 0 results                      |
| `"send"`                             | Find steps with "Send" button | Works (matches a11y node name) |
| `"transfer tokens"`                  | Find send flow (synonym)      | 0 results                      |

### 1.3 Root Cause Analysis

The `computeSearchScore` method (lines 641-673 in `knowledge-store.ts`) does:

```typescript
private computeSearchScore(step: StepRecord, query: string): number {
  if (step.tool.name.toLowerCase().includes(query)) { score += 10; }
  if (step.observation?.state?.currentScreen?.toLowerCase().includes(query)) { score += 8; }
  // ... exact substring matching against each field
}
```

The query is passed as a single lowercase string. Multi-word queries like `"send flow"` look for that exact substring in each field.

---

## 2) Design Principles

### 2.1 Minimize Agent Learning Time

- Agents should find relevant prior sessions on first query attempt
- Natural language queries should work without requiring exact field knowledge
- Session-level intent (goal, flowTags) should be the primary matching signal

### 2.2 Resilience to Codebase Changes

- Prefer stable semantics (a11y names, screen names, labels) over brittle identifiers (testIds)
- Tokenize identifiers to survive partial renames
- Weight signals by stability:
  - **High stability**: screen names, labels, a11y roles
  - **Medium stability**: a11y node names, flowTags
  - **Low stability**: testIds, CSS selectors

### 2.3 Backward Compatibility

- Existing queries that work today must continue to work
- No changes to tool input schema
- Output schema changes are additive only

---

## 3) Requirements

### 3.1 Functional Requirements

| ID   | Requirement                                             | Priority |
| ---- | ------------------------------------------------------- | -------- |
| FR-1 | Tokenize queries into individual words                  | P0       |
| FR-2 | Match any token against fields (bag-of-words)           | P0       |
| FR-3 | Remove stopwords from queries                           | P0       |
| FR-4 | Search session metadata (goal, flowTags, tags)          | P1       |
| FR-5 | Rank sessions before searching steps (two-level search) | P1       |
| FR-6 | Include match evidence in result snippets               | P2       |
| FR-7 | Tokenize testIds (split kebab-case/camelCase)           | P3       |
| FR-8 | Expand queries with synonyms for core actions           | P4       |

### 3.2 Non-Functional Requirements

| ID    | Requirement                                                               |
| ----- | ------------------------------------------------------------------------- |
| NFR-1 | Search must complete in <500ms for typical knowledge stores (<1000 steps) |
| NFR-2 | Memory usage must not exceed 100MB during search                          |
| NFR-3 | No new dependencies required                                              |

---

## 4) Implementation Plan

### 4.1 P0: Tokenize Queries (~1 hour)

#### 4.1.1 Add Tokenization Utility

**Location**: `knowledge-store.ts` (top of file, after imports)

```typescript
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
 *
 * @example
 * tokenize('send flow ETH to another account')
 * // Returns: ['send', 'eth', 'another', 'account']
 */
function tokenize(text: string): string[] {
  if (!text) return [];

  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(
      (token) => token.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(token),
    );

  return [...new Set(tokens)];
}
```

#### 4.1.2 Update `computeSearchScore` Signature

**Current**:

```typescript
private computeSearchScore(step: StepRecord, query: string): number
```

**Updated**:

```typescript
private computeSearchScore(step: StepRecord, queryTokens: string[]): number
```

#### 4.1.3 Update `computeSearchScore` Implementation

```typescript
private computeSearchScore(step: StepRecord, queryTokens: string[]): number {
  let score = 0;
  let matchedTokens = 0;

  for (const token of queryTokens) {
    let tokenMatched = false;

    // Tool name match (highest weight - stable)
    if (step.tool.name.toLowerCase().includes(token)) {
      score += 10;
      tokenMatched = true;
    }

    // Screen name match (high weight - stable)
    if (step.observation?.state?.currentScreen?.toLowerCase().includes(token)) {
      score += 8;
      tokenMatched = true;
    }

    // Target testId match (medium weight - less stable)
    if (step.tool.target?.testId?.toLowerCase().includes(token)) {
      score += 6;
      tokenMatched = true;
    }

    // Labels match (medium weight - stable semantic categories)
    for (const label of step.labels ?? []) {
      if (label.toLowerCase().includes(token)) {
        score += 5;
        tokenMatched = true;
        break;
      }
    }

    // Visible testIds match (low weight)
    for (const testId of step.observation?.testIds ?? []) {
      if (testId.testId.toLowerCase().includes(token)) {
        score += 3;
        tokenMatched = true;
        break;
      }
    }

    // A11y node names/roles match (low weight but stable)
    for (const node of step.observation?.a11y?.nodes ?? []) {
      if (
        node.name.toLowerCase().includes(token) ||
        node.role.toLowerCase().includes(token)
      ) {
        score += 2;
        tokenMatched = true;
        break;
      }
    }

    if (tokenMatched) matchedTokens++;
  }

  // Token coverage bonus: reward matching more unique tokens
  if (queryTokens.length > 0) {
    const coverageRatio = matchedTokens / queryTokens.length;
    score += Math.floor(coverageRatio * 5); // 0-5 bonus
  }

  return score;
}
```

#### 4.1.4 Update `searchSteps` Method

**Change at line 369**:

```typescript
// Before:
const queryLower = query.toLowerCase();

// After:
const queryTokens = tokenize(query);
if (queryTokens.length === 0) {
  return []; // No meaningful search terms
}
```

**Change at line 379**:

```typescript
// Before:
const score = this.computeSearchScore(step, queryLower);

// After:
const score = this.computeSearchScore(step, queryTokens);
```

#### 4.1.5 Unit Tests

**Location**: `knowledge-store.test.ts`

```typescript
describe('tokenize', () => {
  it('splits query into individual words', () => {
    const tokens = tokenize('send flow ETH to another account');
    expect(tokens).toContain('send');
    expect(tokens).toContain('eth');
    expect(tokens).toContain('another');
    expect(tokens).toContain('account');
  });

  it('removes stopwords', () => {
    const tokens = tokenize('send to the account');
    expect(tokens).not.toContain('to');
    expect(tokens).not.toContain('the');
  });

  it('removes short tokens', () => {
    const tokens = tokenize('a b cd efg');
    expect(tokens).not.toContain('a');
    expect(tokens).not.toContain('b');
    expect(tokens).toContain('cd');
    expect(tokens).toContain('efg');
  });

  it('handles empty and whitespace strings', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });

  it('deduplicates tokens', () => {
    const tokens = tokenize('send send SEND');
    expect(tokens).toEqual(['send']);
  });
});

describe('searchSteps with tokenized queries', () => {
  it('finds steps when any token matches', async () => {
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'send-button' },
      outcome: { ok: true },
      observation: createDefaultObservation(
        { ...mockState, currentScreen: 'home' },
        [],
        [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
      ),
    });

    const results = await knowledgeStore.searchSteps(
      'send flow ETH to account',
      10,
      'current',
      testSessionId,
    );

    expect(results.length).toBeGreaterThan(0);
  });

  it('ranks results by token coverage', async () => {
    // Step 1: matches "send" only
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'send-button' },
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    // Step 2: matches "send" and "account"
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'send-to-account' },
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    const results = await knowledgeStore.searchSteps(
      'send account',
      10,
      'current',
      testSessionId,
    );

    // Step with more token matches should rank higher
    expect(results[0].snippet).toContain('send-to-account');
  });
});
```

---

### 4.2 P1: Search Session Metadata (~2 hours)

#### 4.2.1 Add Session Scoring Method

**Location**: `knowledge-store.ts` (new private method)

```typescript
/**
 * Computes a relevance score for a session based on query tokens.
 * Higher scores indicate better session-level matches.
 *
 * Scoring weights:
 * - flowTags match: +12 (strongest signal - exact flow category)
 * - goal token overlap: +6 per token (user's stated intent)
 * - tags match: +4 (medium signal)
 * - git branch match: +2 (useful for feature branches)
 * - recency bonus: +3 (<24h), +1 (<72h)
 */
private computeSessionScore(
  metadata: SessionMetadata,
  queryTokens: string[],
): number {
  let score = 0;

  // flowTags match (strongest signal - exact flow category)
  for (const token of queryTokens) {
    for (const flowTag of metadata.flowTags) {
      if (flowTag.toLowerCase().includes(token)) {
        score += 12;
        break;
      }
    }
  }

  // Goal token overlap (medium signal - user's stated intent)
  const goalTokens = tokenize(metadata.goal ?? '');
  for (const token of queryTokens) {
    if (goalTokens.includes(token)) {
      score += 6;
    }
  }

  // Tags match (medium signal)
  for (const token of queryTokens) {
    for (const tag of metadata.tags) {
      if (tag.toLowerCase().includes(token)) {
        score += 4;
        break;
      }
    }
  }

  // Git branch match (weak signal - useful for feature branches)
  if (metadata.git?.branch) {
    const branchTokens = tokenize(metadata.git.branch);
    for (const token of queryTokens) {
      if (branchTokens.includes(token)) {
        score += 2;
        break;
      }
    }
  }

  // Recency bonus (prefer recent sessions)
  const ageHours = (Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) {
    score += 3;
  } else if (ageHours < 72) {
    score += 1;
  }

  return score;
}
```

#### 4.2.2 Update `searchSteps` for Two-Level Search

Replace the existing `searchSteps` implementation:

```typescript
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

  const sessionIds = await this.resolveSessionIds(
    scope,
    currentSessionId,
    filters,
  );

  // Phase 1: Score and rank sessions by metadata relevance
  const scoredSessions: { sessionId: string; score: number; metadata?: SessionMetadata }[] = [];

  for (const sid of sessionIds) {
    const metadata = await this.readSessionMetadata(sid);
    const sessionScore = metadata
      ? this.computeSessionScore(metadata, queryTokens)
      : 0;
    scoredSessions.push({ sessionId: sid, score: sessionScore, metadata: metadata ?? undefined });
  }

  // Sort sessions by score (descending), keep top K candidates
  scoredSessions.sort((a, b) => b.score - a.score);
  const maxCandidateSessions = 20;
  const topSessions = scoredSessions.slice(0, Math.min(maxCandidateSessions, scoredSessions.length));

  // Phase 2: Search steps within top sessions
  const matches: {
    step: StepRecord;
    score: number;
    sessionScore: number;
    sessionGoal?: string;
  }[] = [];

  for (const { sessionId: sid, score: sessionScore, metadata } of topSessions) {
    const steps = await this.loadSessionSteps(sid);

    for (const { step } of steps) {
      if (!this.stepMatchesFilters(step, filters)) {
        continue;
      }

      const stepScore = this.computeSearchScore(step, queryTokens);

      // Combine session score with step score
      const combinedScore = sessionScore + stepScore;

      if (combinedScore > 0) {
        matches.push({
          step,
          score: combinedScore,
          sessionScore,
          sessionGoal: metadata?.goal,
        });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, limit).map((m) => this.summarizeStep(m.step));
}
```

#### 4.2.3 Unit Tests

```typescript
describe('searchSteps with session metadata', () => {
  beforeEach(async () => {
    await knowledgeStore.writeSessionMetadata({
      schemaVersion: 1,
      sessionId: testSessionId,
      createdAt: new Date().toISOString(),
      goal: 'Send 0.1 ETH to another account',
      flowTags: ['send'],
      tags: ['visual-test'],
    });
  });

  it('matches session goal tokens', async () => {
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    const results = await knowledgeStore.searchSteps(
      'send ETH account',
      10,
      'all',
      undefined,
    );

    expect(results.length).toBeGreaterThan(0);
  });

  it('prioritizes sessions with matching flowTags', async () => {
    // Create another session with different flowTag
    const otherSessionId = 'mm-other-session';
    await knowledgeStore.writeSessionMetadata({
      schemaVersion: 1,
      sessionId: otherSessionId,
      createdAt: new Date().toISOString(),
      goal: 'Test swap functionality',
      flowTags: ['swap'],
      tags: [],
    });

    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'action-button' },
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    await knowledgeStore.recordStep({
      sessionId: otherSessionId,
      toolName: 'mm_click',
      target: { testId: 'action-button' },
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    const results = await knowledgeStore.searchSteps(
      'send',
      10,
      'all',
      undefined,
    );

    // Result from session with 'send' flowTag should rank first
    expect(results[0].sessionId).toBe(testSessionId);
  });

  it('applies recency bonus to recent sessions', async () => {
    // Create old session
    const oldSessionId = 'mm-old-session';
    const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000); // 100 hours ago
    await knowledgeStore.writeSessionMetadata({
      schemaVersion: 1,
      sessionId: oldSessionId,
      createdAt: oldDate.toISOString(),
      goal: 'Send tokens',
      flowTags: ['send'],
      tags: [],
    });

    await knowledgeStore.recordStep({
      sessionId: oldSessionId,
      toolName: 'mm_click',
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    await knowledgeStore.recordStep({
      sessionId: testSessionId, // Recent session
      toolName: 'mm_click',
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    const results = await knowledgeStore.searchSteps(
      'send',
      10,
      'all',
      undefined,
    );

    // Recent session should rank higher due to recency bonus
    expect(results[0].sessionId).toBe(testSessionId);
  });
});
```

---

### 4.3 P2: Improve Snippets (~1 hour)

#### 4.3.1 Update `KnowledgeStepSummary` Type

**Location**: `types.ts`

```typescript
/**
 * Summary of a knowledge step for search results.
 */
export type KnowledgeStepSummary = {
  timestamp: string;
  tool: string;
  screen: string;
  snippet: string;
  /** Fields that matched the search query */
  matchedFields?: string[];
  /** Goal of the session this step belongs to */
  sessionGoal?: string;
};
```

#### 4.3.2 Update `computeSearchScore` to Return Match Info

```typescript
/**
 * Result of computing search score for a step.
 */
type SearchScoreResult = {
  score: number;
  matchedFields: string[];
};

private computeSearchScore(
  step: StepRecord,
  queryTokens: string[],
): SearchScoreResult {
  let score = 0;
  const matchedFields: string[] = [];

  for (const token of queryTokens) {
    // Tool name match
    if (step.tool.name.toLowerCase().includes(token)) {
      score += 10;
      if (!matchedFields.includes('tool')) {
        matchedFields.push(`tool:${step.tool.name}`);
      }
    }

    // Screen name match
    const screen = step.observation?.state?.currentScreen;
    if (screen?.toLowerCase().includes(token)) {
      score += 8;
      if (!matchedFields.includes('screen')) {
        matchedFields.push(`screen:${screen}`);
      }
    }

    // Target testId match
    const targetTestId = step.tool.target?.testId;
    if (targetTestId?.toLowerCase().includes(token)) {
      score += 6;
      matchedFields.push(`testId:${targetTestId}`);
    }

    // Labels match
    for (const label of step.labels ?? []) {
      if (label.toLowerCase().includes(token)) {
        score += 5;
        if (!matchedFields.some(f => f.startsWith('label:'))) {
          matchedFields.push(`label:${label}`);
        }
        break;
      }
    }

    // Visible testIds match
    for (const testId of step.observation?.testIds ?? []) {
      if (testId.testId.toLowerCase().includes(token)) {
        score += 3;
        // Don't add to matchedFields to avoid noise
        break;
      }
    }

    // A11y node names/roles match
    for (const node of step.observation?.a11y?.nodes ?? []) {
      if (node.name.toLowerCase().includes(token)) {
        score += 2;
        matchedFields.push(`a11y:${node.role}:"${node.name}"`);
        break;
      }
      if (node.role.toLowerCase().includes(token)) {
        score += 2;
        matchedFields.push(`a11y:${node.role}`);
        break;
      }
    }
  }

  // Token coverage bonus
  const matchedTokenCount = matchedFields.length > 0 ?
    queryTokens.filter(t => matchedFields.some(f => f.toLowerCase().includes(t))).length : 0;
  if (queryTokens.length > 0) {
    const coverageRatio = matchedTokenCount / queryTokens.length;
    score += Math.floor(coverageRatio * 5);
  }

  return { score, matchedFields };
}
```

#### 4.3.3 Update `summarizeStep` Method

```typescript
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
    matchedFields: matchedFields?.length ? matchedFields : undefined,
    sessionGoal,
  };
}
```

#### 4.3.4 Update `generateSnippet` Method

```typescript
private generateSnippet(step: StepRecord, matchedFields?: string[]): string {
  const parts: string[] = [];

  // Show what matched first (most useful info for agents)
  if (matchedFields && matchedFields.length > 0) {
    const topMatches = matchedFields.slice(0, 3).join(', ');
    parts.push(`match: ${topMatches}`);
  }

  // Target info
  if (step.tool.target?.testId) {
    parts.push(`testId: ${step.tool.target.testId}`);
  } else if (step.tool.target?.a11yRef) {
    parts.push(`ref: ${step.tool.target.a11yRef}`);
  } else if (step.tool.target?.selector) {
    const shortSelector = step.tool.target.selector.substring(0, 30);
    parts.push(`selector: ${shortSelector}`);
  }

  // Labels (semantic context)
  if (step.labels && step.labels.length > 0) {
    parts.push(`labels: ${step.labels.join(', ')}`);
  }

  // Screen
  if (step.observation?.state?.currentScreen) {
    parts.push(`screen: ${step.observation.state.currentScreen}`);
  }

  // Error info
  if (!step.outcome.ok && step.outcome.error) {
    parts.push(`error: ${step.outcome.error.code}`);
  }

  return parts.join(', ') || step.tool.name;
}
```

#### 4.3.5 Update `searchSteps` to Pass Match Info

```typescript
// In searchSteps, update the step scoring loop:
for (const { step } of steps) {
  if (!this.stepMatchesFilters(step, filters)) {
    continue;
  }

  const { score: stepScore, matchedFields } = this.computeSearchScore(
    step,
    queryTokens,
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

// Update the return statement:
return matches
  .slice(0, limit)
  .map((m) => this.summarizeStep(m.step, m.matchedFields, m.sessionGoal));
```

#### 4.3.6 Unit Tests

```typescript
describe('snippet generation with match info', () => {
  it('includes match evidence in snippet', async () => {
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'send-button' },
      outcome: { ok: true },
      observation: createDefaultObservation(
        mockState,
        [],
        [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
      ),
    });

    const results = await knowledgeStore.searchSteps(
      'send',
      10,
      'current',
      testSessionId,
    );

    expect(results[0].snippet).toContain('match:');
    expect(results[0].matchedFields).toBeDefined();
    expect(results[0].matchedFields).toContain('a11y:button:"Send"');
  });

  it('includes session goal when available', async () => {
    await knowledgeStore.writeSessionMetadata({
      schemaVersion: 1,
      sessionId: testSessionId,
      createdAt: new Date().toISOString(),
      goal: 'Test send flow',
      flowTags: ['send'],
      tags: [],
    });

    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    const results = await knowledgeStore.searchSteps(
      'send',
      10,
      'all',
      undefined,
    );

    expect(results[0].sessionGoal).toBe('Test send flow');
  });
});
```

---

### 4.4 P3: Tokenize TestIds (~1 hour)

#### 4.4.1 Add Identifier Tokenization Function

**Location**: `knowledge-store.ts`

```typescript
/**
 * Tokenizes an identifier (testId, CSS class, etc.) into words.
 * Handles kebab-case, camelCase, snake_case, and mixed formats.
 *
 * @param identifier - The identifier to tokenize
 * @returns Array of tokens
 *
 * @example
 * tokenizeIdentifier('coin-overview-send-button')
 * // Returns: ['coin', 'overview', 'send', 'button']
 *
 * @example
 * tokenizeIdentifier('sendTokenButton')
 * // Returns: ['send', 'token', 'button']
 *
 * @example
 * tokenizeIdentifier('send_token_btn')
 * // Returns: ['send', 'token', 'btn']
 */
function tokenizeIdentifier(identifier: string): string[] {
  if (!identifier) return [];

  // Split camelCase: 'sendToken' → 'send Token'
  const withSpaces = identifier
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // Split on non-alphanumeric (handles kebab-case, snake_case)
  const tokens = withSpaces
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

  return [...new Set(tokens)];
}
```

#### 4.4.2 Update `computeSearchScore` to Use Tokenized TestIds

```typescript
// In computeSearchScore, replace the testId matching sections:

// Target testId match (tokenized)
if (step.tool.target?.testId) {
  const testIdTokens = tokenizeIdentifier(step.tool.target.testId);
  for (const token of queryTokens) {
    if (testIdTokens.includes(token)) {
      score += 6;
      matchedFields.push(`testId:${step.tool.target.testId}`);
      break;
    }
  }
}

// Visible testIds match (tokenized)
for (const testIdItem of step.observation?.testIds ?? []) {
  const testIdTokens = tokenizeIdentifier(testIdItem.testId);
  for (const token of queryTokens) {
    if (testIdTokens.includes(token)) {
      score += 3;
      // Don't add to matchedFields to keep noise low
      break;
    }
  }
}
```

#### 4.4.3 Unit Tests

```typescript
describe('tokenizeIdentifier', () => {
  it('splits kebab-case', () => {
    const tokens = tokenizeIdentifier('coin-overview-send-button');
    expect(tokens).toEqual(['coin', 'overview', 'send', 'button']);
  });

  it('splits camelCase', () => {
    const tokens = tokenizeIdentifier('sendTokenButton');
    expect(tokens).toEqual(['send', 'token', 'button']);
  });

  it('splits snake_case', () => {
    const tokens = tokenizeIdentifier('send_token_btn');
    expect(tokens).toEqual(['send', 'token', 'btn']);
  });

  it('handles mixed formats', () => {
    const tokens = tokenizeIdentifier('coin-overview_sendButton');
    expect(tokens).toContain('coin');
    expect(tokens).toContain('overview');
    expect(tokens).toContain('send');
    expect(tokens).toContain('button');
  });

  it('handles uppercase abbreviations', () => {
    const tokens = tokenizeIdentifier('sendETHButton');
    expect(tokens).toContain('send');
    expect(tokens).toContain('eth');
    expect(tokens).toContain('button');
  });

  it('returns empty array for empty input', () => {
    expect(tokenizeIdentifier('')).toEqual([]);
    expect(tokenizeIdentifier(undefined as unknown as string)).toEqual([]);
  });
});

describe('searchSteps with tokenized testIds', () => {
  it('matches tokenized testId components', async () => {
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'coin-overview-send-button' },
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    const results = await knowledgeStore.searchSteps(
      'send',
      10,
      'current',
      testSessionId,
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchedFields).toContain(
      'testId:coin-overview-send-button',
    );
  });

  it('matches camelCase testId components', async () => {
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'sendTokenButton' },
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    const results = await knowledgeStore.searchSteps(
      'token',
      10,
      'current',
      testSessionId,
    );

    expect(results.length).toBeGreaterThan(0);
  });
});
```

---

### 4.5 P4: Add Synonyms (~30 minutes)

#### 4.5.1 Add Synonyms Constant

**Location**: `knowledge-store.ts` (top of file)

```typescript
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
```

#### 4.5.2 Add Synonym Expansion Function

```typescript
/**
 * Expands query tokens with synonyms.
 * Returns original tokens plus any synonyms for bidirectional matching.
 *
 * @param tokens - Array of query tokens
 * @returns Expanded array including synonyms
 *
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
```

#### 4.5.3 Update `searchSteps` to Use Expanded Tokens

```typescript
async searchSteps(...) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  // Expand tokens with synonyms for broader matching
  const expandedTokens = expandWithSynonyms(queryTokens);

  // Use expandedTokens for session scoring
  // ... (use expandedTokens instead of queryTokens in computeSessionScore calls)

  // Use expandedTokens for step scoring
  // ... (use expandedTokens instead of queryTokens in computeSearchScore calls)
}
```

#### 4.5.4 Unit Tests

```typescript
describe('expandWithSynonyms', () => {
  it('expands canonical terms to synonyms', () => {
    const expanded = expandWithSynonyms(['send']);
    expect(expanded).toContain('send');
    expect(expanded).toContain('transfer');
    expect(expanded).toContain('pay');
  });

  it('expands synonym terms to canonical and other synonyms', () => {
    const expanded = expandWithSynonyms(['transfer']);
    expect(expanded).toContain('send');
    expect(expanded).toContain('transfer');
    expect(expanded).toContain('pay');
  });

  it('does not expand non-action terms', () => {
    const expanded = expandWithSynonyms(['eth', 'account', 'balance']);
    expect(expanded).toEqual(['eth', 'account', 'balance']);
  });

  it('handles multiple tokens with some having synonyms', () => {
    const expanded = expandWithSynonyms(['send', 'eth']);
    expect(expanded).toContain('send');
    expect(expanded).toContain('transfer');
    expect(expanded).toContain('eth');
    expect(expanded).not.toContain('ethereum'); // Not a defined synonym
  });

  it('deduplicates results', () => {
    const expanded = expandWithSynonyms(['send', 'transfer']);
    const unique = [...new Set(expanded)];
    expect(expanded.length).toBe(unique.length);
  });
});

describe('searchSteps with synonyms', () => {
  it('matches when using synonym', async () => {
    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      target: { testId: 'send-button' },
      outcome: { ok: true },
      observation: createDefaultObservation(
        mockState,
        [],
        [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
      ),
    });

    // Search with synonym "transfer" should find "Send" button
    const results = await knowledgeStore.searchSteps(
      'transfer ETH',
      10,
      'current',
      testSessionId,
    );

    expect(results.length).toBeGreaterThan(0);
  });

  it('matches session goals via synonyms', async () => {
    await knowledgeStore.writeSessionMetadata({
      schemaVersion: 1,
      sessionId: testSessionId,
      createdAt: new Date().toISOString(),
      goal: 'Send 0.1 ETH to another account',
      flowTags: ['send'],
      tags: [],
    });

    await knowledgeStore.recordStep({
      sessionId: testSessionId,
      toolName: 'mm_click',
      outcome: { ok: true },
      observation: createDefaultObservation(mockState),
    });

    // Search with synonym "transfer" should match goal "Send"
    const results = await knowledgeStore.searchSteps(
      'transfer tokens',
      10,
      'all',
      undefined,
    );

    expect(results.length).toBeGreaterThan(0);
  });
});
```

---

## 5) Files to Modify

| File                      | Changes                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `knowledge-store.ts`      | Add `tokenize`, `tokenizeIdentifier`, `expandWithSynonyms`, `computeSessionScore`; update `computeSearchScore`, `searchSteps`, `summarizeStep`, `generateSnippet` |
| `types.ts`                | Add `matchedFields` and `sessionGoal` to `KnowledgeStepSummary`                                                                                                   |
| `knowledge-store.test.ts` | Add tests for all new functions and updated behavior                                                                                                              |

---

## 6) Implementation Order

| Phase | Description             | Estimated Time | Dependencies |
| ----- | ----------------------- | -------------- | ------------ |
| P0    | Tokenize queries        | 1 hour         | None         |
| P1    | Session metadata search | 2 hours        | P0           |
| P2    | Improve snippets        | 1 hour         | P0, P1       |
| P3    | Tokenize testIds        | 1 hour         | P0           |
| P4    | Add synonyms            | 30 minutes     | P0           |

**Total estimated time: ~5.5 hours**

P0 is foundational and must be completed first. P1-P4 can be implemented in any order after P0, though the order above is recommended for maximum impact.

---

## 7) Expected Outcomes

### 7.1 Query Improvements

| Query                        | Before              | After                                                  |
| ---------------------------- | ------------------- | ------------------------------------------------------ |
| `"send flow ETH to account"` | 0 results           | Finds send flow sessions + steps with "Send" button    |
| `"transfer tokens"`          | 0 results           | Finds send flow via synonym expansion                  |
| `"unlock"`                   | Finds unlock screen | Same + higher ranking for sessions with unlock flowTag |
| `"coin-overview"`            | Partial match       | Matches any step with `coin-overview-*` testIds        |

### 7.2 Snippet Improvements

**Before**:

```
screen: home
```

**After**:

```
match: a11y:button:"Send", testId:send-button, labels: interaction, screen: home
```

### 7.3 Resilience Features

- **Tokenization**: Survives testId renames (partial matches still work)
- **Session-first search**: Matches user intent via goal/flowTags
- **Synonym expansion**: Handles vocabulary variations
- **A11y-based matching**: More stable than testIds
- **Weighted scoring**: Prefers stable signals over brittle ones

---

## 8) Implementation Hardening (Post-Review)

The following improvements were added after code review to address edge cases and improve robustness:

### 8.1 Tool-Specific Stopwords

**Problem**: Queries like `"mm_click"` tokenized to `['mm', 'click']`, where `mm` matched nearly every tool name, causing noisy results.

**Solution**: Added `'mm'` and `'mcp'` to STOPWORDS list.

```typescript
const STOPWORDS = new Set([
  // ... existing stopwords ...
  'mm',
  'mcp',
]);
```

**Test added**: `tokenize stopwords` - verifies `mm_click` query only matches on `click` token.

### 8.2 Deterministic Session Tie-Breaking

**Problem**: When multiple sessions had the same score, the top-20 cutoff could exclude relevant sessions arbitrarily (dependent on filesystem ordering).

**Solution**: Added secondary sort by `createdAt` (descending) and tertiary sort by `sessionId` (alphabetical) for deterministic ordering.

```typescript
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
```

### 8.3 Deduplicated Match Evidence

**Problem**: `matchedFields` could contain duplicate entries when multiple query tokens matched the same field.

**Solution**: Changed `matchedFields` from array to `Set<string>` during scoring, then converted back to array at the end.

```typescript
const matchedFieldsSet = new Set<string>();
// ... scoring logic adds to set ...
return { score, matchedFields: [...matchedFieldsSet] };
```

**Test added**: `matchedFields deduplication` - verifies no duplicate testId or a11y entries.

### 8.4 Cached Per-Step Tokenization

**Problem**: `tokenizeIdentifier()` was called repeatedly per query token for the same step's testId, causing unnecessary computation.

**Solution**: Pre-compute tokenized testIds once per step before iterating over query tokens.

```typescript
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
```

---

## 9) Future Considerations

### 9.1 Not Included in This Spec

- **Fuzzy matching**: Typo tolerance (e.g., "sned" → "send")
- **Embedding-based search**: Semantic similarity using ML models
- **Cross-repo knowledge sharing**: Shared knowledge store across repositories
- **Inverted index**: Performance optimization for large knowledge stores

### 9.2 When to Revisit

- Knowledge store grows to >10,000 steps (consider inverted index)
- Search latency exceeds 500ms consistently
- Agents frequently use domain-specific vocabulary not in synonyms
- Cross-team knowledge sharing becomes a requirement

---

## 10) References

- SPEC-00: MetaMask Visual Testing MCP Server + Knowledge Store (v1)
- SPEC-01: Knowledge Store Schema
- SPEC-02: `mm_describe_screen.priorKnowledge` (Knowledge Reuse Injection)
- `knowledge-store.ts`: Current implementation
- `knowledge-store.test.ts`: Existing tests
