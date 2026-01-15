import type {
  KnowledgeLastInput,
  KnowledgeLastResult,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
  KnowledgeSummarizeInput,
  KnowledgeSummarizeResult,
  McpResponse,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore } from '../knowledge-store';

export async function handleKnowledgeLast(
  input: KnowledgeLastInput,
): Promise<McpResponse<KnowledgeLastResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const n = input.n ?? 20;

  try {
    const steps = await knowledgeStore.getLastSteps(sessionId, n);

    return createSuccessResponse<KnowledgeLastResult>(
      { steps },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_KNOWLEDGE_ERROR,
      `Failed to retrieve steps: ${message}`,
      { n },
      sessionId,
      startTime,
    );
  }
}

export async function handleKnowledgeSearch(
  input: KnowledgeSearchInput,
): Promise<McpResponse<KnowledgeSearchResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const limit = input.limit ?? 20;

  try {
    const matches = await knowledgeStore.searchSteps(
      input.query,
      limit,
      sessionId ?? undefined,
    );

    return createSuccessResponse<KnowledgeSearchResult>(
      {
        matches,
        query: input.query,
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_KNOWLEDGE_ERROR,
      `Search failed: ${message}`,
      { query: input.query, limit },
      sessionId,
      startTime,
    );
  }
}

export async function handleKnowledgeSummarize(
  input: KnowledgeSummarizeInput,
): Promise<McpResponse<KnowledgeSummarizeResult>> {
  const startTime = Date.now();
  const targetSessionId = input.sessionId ?? sessionManager.getSessionId();

  if (!targetSessionId) {
    return createErrorResponse(
      ErrorCodes.MM_INVALID_INPUT,
      'No sessionId provided and no active session',
      undefined,
      undefined,
      startTime,
    );
  }

  try {
    const summary = await knowledgeStore.summarizeSession(targetSessionId);

    return createSuccessResponse<KnowledgeSummarizeResult>(
      summary,
      targetSessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_KNOWLEDGE_ERROR,
      `Summarize failed: ${message}`,
      { sessionId: targetSessionId },
      targetSessionId,
      startTime,
    );
  }
}
