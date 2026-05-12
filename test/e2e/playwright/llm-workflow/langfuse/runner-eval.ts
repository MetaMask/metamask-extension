import path from 'path';
import { readFileSync } from 'fs';
import type { JudgeConfig } from './provider-types';
import { runDeterministicEvals, type EvalScore } from './evals';

const JUDGE_PROMPT = readFileSync(
  path.join(__dirname, 'evals', 'judge-prompt.md'),
  'utf-8',
).trim();

type EvalResult = {
  task_completion: { score: number; reason: string };
  efficiency: { score: number; reason: string };
  correctness: { score: number; reason: string };
  summary: string;
};

export type EvalParams = {
  prompt: string;
  result: string | undefined;
  conversationLog: string[];
  turns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  traceId: string | undefined;
  success: boolean;
};

async function postLangfuseScore(params: {
  traceId: string;
  name: string;
  value: number;
  dataType: 'NUMERIC';
  comment?: string;
}): Promise<void> {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL;
  if (!publicKey || !secretKey || !baseUrl) return;

  const authString = Buffer.from(`${publicKey}:${secretKey}`).toString(
    'base64',
  );

  try {
    const resp = await fetch(`${baseUrl}/api/public/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        traceId: params.traceId,
        name: params.name,
        value: params.value,
        dataType: params.dataType,
        comment: params.comment?.slice(0, 500),
      }),
    });
    if (!resp.ok) {
      process.stderr.write(
        `[EVAL] Failed to post score ${params.name}: ${resp.status}\n`,
      );
    }
  } catch {
    /* fire-and-forget */
  }
}

export async function evaluateRun(
  params: EvalParams,
  judge: JudgeConfig,
): Promise<void> {
  if (process.env.LANGFUSE_ENABLED !== 'true' || !params.traceId) return;

  process.stderr.write('[EVAL] Running deterministic evaluations...\n');
  const deterministicScores = runDeterministicEvals({
    conversationLog: params.conversationLog,
    turns: params.turns,
    totalInputTokens: params.totalInputTokens,
    totalOutputTokens: params.totalOutputTokens,
    traceId: params.traceId,
  });

  for (const score of deterministicScores) {
    await postLangfuseScore({
      traceId: params.traceId,
      name: score.name,
      value: score.value,
      dataType: 'NUMERIC',
      comment: score.comment,
    });
    process.stderr.write(
      `[EVAL] ${score.name}: ${score.value.toFixed(1)} — ${score.comment}\n`,
    );
  }

  process.stderr.write(
    `[EVAL] Running LLM-as-a-judge evaluation (${judge.model})...\n`,
  );

  try {
    const transcript = params.conversationLog.join('\n\n').slice(0, 30000);
    const metricsBlock = formatMetricsBlock(deterministicScores);

    const evalPrompt = `${JUDGE_PROMPT}\n\n---\n\nTASK: ${params.prompt}\n\nCOMPLETED: ${params.success ? 'Yes' : `No (stopped after ${params.turns} turns)`}\n\nFINAL RESULT: ${params.result?.slice(0, 2000) ?? 'None'}\n\nAUTOMATED METRICS:\n${metricsBlock}\n\nAGENT TRANSCRIPT:\n${transcript}`;

    const text = await judge.evaluate(evalPrompt, 1024);

    const jsonMatch = /\{[\s\S]*\}/.exec(text);
    if (!jsonMatch) {
      process.stderr.write('[EVAL] Judge did not return valid JSON\n');
      return;
    }

    const evaluation: EvalResult = JSON.parse(jsonMatch[0]);

    const scores = [
      { name: 'task_completion', ...evaluation.task_completion },
      { name: 'efficiency', ...evaluation.efficiency },
      { name: 'correctness', ...evaluation.correctness },
    ];

    for (const score of scores) {
      await postLangfuseScore({
        traceId: params.traceId,
        name: score.name,
        value: score.score,
        dataType: 'NUMERIC',
        comment: score.reason,
      });
      process.stderr.write(
        `[EVAL] ${score.name}: ${score.score.toFixed(1)} — ${score.reason}\n`,
      );
    }

    process.stderr.write(`[EVAL] Summary: ${evaluation.summary}\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[EVAL] LLM judge failed: ${msg}\n`);
  }
}

function formatMetricsBlock(scores: EvalScore[]): string {
  return scores
    .map((s) => `- ${s.name}: ${s.value.toFixed(2)} (${s.comment})`)
    .join('\n');
}
