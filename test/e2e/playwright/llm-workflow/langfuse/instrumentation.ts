import path from 'path';
import { config } from 'dotenv';
import { resolveRepoRoot } from '../resolve-repo-root';

config({ path: path.join(resolveRepoRoot(__dirname), '.env.langfuse') });

import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';

const ENABLED =
  process.env.LANGFUSE_ENABLED === 'true' &&
  Boolean(process.env.LANGFUSE_PUBLIC_KEY) &&
  Boolean(process.env.LANGFUSE_SECRET_KEY);

if (ENABLED) {
  process.stderr.write('[LANGFUSE] Tracing enabled\n');
} else {
  process.stderr.write(
    `[LANGFUSE] Tracing disabled (LANGFUSE_ENABLED=${process.env.LANGFUSE_ENABLED ?? 'unset'})\n`,
  );
}

export const langfuseProcessor = ENABLED
  ? new LangfuseSpanProcessor({
      exportMode: 'batched',
      shouldExportSpan: ({ otelSpan }) => {
        const attrs = otelSpan.attributes;
        const hasContent =
          'langfuse.observation.input' in attrs ||
          'langfuse.observation.output' in attrs ||
          'langfuse.observation.type' in attrs ||
          Object.keys(attrs).some((k) => k.startsWith('gen_ai.'));
        return hasContent;
      },
    })
  : undefined;

export const otelSdk = ENABLED
  ? new NodeSDK({ spanProcessors: [langfuseProcessor!] })
  : undefined;

otelSdk?.start();
