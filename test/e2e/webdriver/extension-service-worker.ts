import type { Driver } from './driver';

type CdpConnection = {
  sessionId: string | null;
  send<Result>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<{
    error?: { message?: string };
    result?: Result;
  }>;
};

type ServiceWorkerTarget = {
  targetId: string;
  type: string;
  url: string;
};

type RuntimeEvaluationResult = {
  exceptionDetails?: {
    exception?: { description?: string };
    text?: string;
  };
  result?: { value?: unknown };
};

export async function executeScriptInExtensionServiceWorker(
  driver: Driver,
  script: string,
  timeout: number = driver.timeout,
): Promise<unknown> {
  const cdpConnection = (await driver.driver.createCDPConnection(
    'browser',
  )) as CdpConnection;

  async function send<Result>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<Result> {
    const { error, result } = await cdpConnection.send<Result>(method, params);

    if (error) {
      throw new Error(
        `CDP ${method} failed: ${error.message ?? 'Unknown error'}`,
      );
    }

    return result as Result;
  }

  const target = (await driver.driver.wait(
    async () => {
      const { targetInfos } = await send<{
        targetInfos: ServiceWorkerTarget[];
      }>('Target.getTargets');

      return targetInfos.find(
        ({ type, url }) =>
          type === 'service_worker' && url.startsWith(driver.extensionUrl),
      );
    },
    timeout,
    `Failed to resolve the extension service worker target for ${driver.extensionUrl}`,
    250,
  )) as ServiceWorkerTarget;

  const { sessionId } = await send<{ sessionId: string }>(
    'Target.attachToTarget',
    {
      targetId: target.targetId,
      flatten: true,
    },
  );

  cdpConnection.sessionId = sessionId;

  try {
    const evaluationResult = await send<RuntimeEvaluationResult>(
      'Runtime.evaluate',
      {
        expression: `(async () => {\n${script}\n})()`,
        awaitPromise: true,
        returnByValue: true,
      },
    );

    if (evaluationResult.exceptionDetails) {
      throw new Error(
        evaluationResult.exceptionDetails.exception?.description ??
          evaluationResult.exceptionDetails.text ??
          'Runtime evaluation failed in the extension service worker',
      );
    }

    return evaluationResult.result?.value;
  } finally {
    cdpConnection.sessionId = null;

    // The worker may terminate before the best-effort cleanup completes.
    await send('Target.detachFromTarget', { sessionId }).catch(() => undefined);
  }
}
