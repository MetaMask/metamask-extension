import type { Driver } from './driver';

type CdpCommandResponse<Result> = {
  error?: {
    code?: number;
    message?: string;
  };
  result?: Result;
};

type CdpConnection = {
  sessionId: string | null;
  send: <Result>(
    method: string,
    params?: Record<string, unknown>,
  ) => Promise<CdpCommandResponse<Result>>;
};

type ServiceWorkerTarget = {
  targetId: string;
  type: string;
  url: string;
};

type GetTargetsResult = {
  targetInfos?: ServiceWorkerTarget[];
};

type AttachToTargetResult = {
  sessionId?: string;
};

type RuntimeEvaluationResult = {
  exceptionDetails?: {
    exception?: {
      description?: string;
    };
    text?: string;
  };
  result?: {
    value?: unknown;
  };
};

async function sendCdpCommand<Result>(
  connection: CdpConnection,
  method: string,
  params?: Record<string, unknown>,
): Promise<Result | undefined> {
  const { error, result } = await connection.send<Result>(method, params);

  if (error) {
    const code = error.code === undefined ? '' : ` (${error.code})`;
    throw new Error(
      `CDP command ${method} failed${code}: ${error.message ?? 'Unknown error'}`,
    );
  }

  return result;
}

/**
 * Executes a script in the extension's MV3 service worker.
 *
 * @param driver - The active E2E driver.
 * @param script - The service worker script body to execute.
 * @param timeout - Maximum time to wait for the service worker target.
 * @returns The script's serialized return value.
 */
export async function executeScriptInExtensionServiceWorker(
  driver: Driver,
  script: string,
  timeout: number = driver.timeout,
): Promise<unknown> {
  const cdpConnection = (await driver.driver.createCDPConnection(
    'browser',
  )) as CdpConnection;
  let target: ServiceWorkerTarget | undefined;

  try {
    await driver.waitUntil(
      async () => {
        const result = await sendCdpCommand<GetTargetsResult>(
          cdpConnection,
          'Target.getTargets',
        );
        target = result?.targetInfos?.find(
          ({ type, url }) =>
            type === 'service_worker' && url.startsWith(driver.extensionUrl),
        );
        return target !== undefined;
      },
      { interval: 250, timeout },
    );
  } catch (error) {
    const result = await sendCdpCommand<GetTargetsResult>(
      cdpConnection,
      'Target.getTargets',
    );
    const errorMessage =
      error instanceof Error && error.message ? `${error.message} ` : '';

    throw new Error(
      `Failed to resolve the extension service worker target for ${
        driver.extensionUrl
      }. ${errorMessage}Known targets: ${JSON.stringify(
        result?.targetInfos ?? [],
        null,
        2,
      )}`,
    );
  }

  if (!target) {
    throw new Error(
      `Failed to resolve the extension service worker target for ${driver.extensionUrl}`,
    );
  }

  const attachResult = await sendCdpCommand<AttachToTargetResult>(
    cdpConnection,
    'Target.attachToTarget',
    {
      targetId: target.targetId,
      flatten: true,
    },
  );
  const sessionId = attachResult?.sessionId;

  if (!sessionId) {
    throw new Error(
      `Failed to attach to extension service worker target ${target.targetId}`,
    );
  }

  cdpConnection.sessionId = sessionId;

  try {
    await sendCdpCommand(cdpConnection, 'Runtime.enable');
    const evaluationResult = await sendCdpCommand<RuntimeEvaluationResult>(
      cdpConnection,
      'Runtime.evaluate',
      {
        expression: `(async () => {\n${script}\n})()`,
        awaitPromise: true,
        returnByValue: true,
      },
    );

    if (evaluationResult?.exceptionDetails) {
      throw new Error(
        evaluationResult.exceptionDetails.exception?.description ??
          evaluationResult.exceptionDetails.text ??
          'Runtime evaluation failed in the extension service worker',
      );
    }

    return evaluationResult?.result?.value;
  } finally {
    cdpConnection.sessionId = null;

    try {
      await sendCdpCommand(cdpConnection, 'Target.detachFromTarget', {
        sessionId,
      });
    } catch {
      // The worker may terminate before the best-effort cleanup completes.
    }
  }
}
