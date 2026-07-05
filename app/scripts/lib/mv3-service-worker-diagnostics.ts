const DIAGNOSTIC_PREFIX = 'MM_MV3_SERVICE_WORKER_DIAG';
const MAX_DIAGNOSTIC_LOGS = 200;

let diagnosticLogCount = 0;
let globalErrorListenersInstalled = false;

export function isMv3ServiceWorkerDiagnosticsEnabled(): boolean {
  return Boolean(process.env.IN_TEST || process.env.METAMASK_DEBUG);
}

export function getDiagnosticError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;
    return {
      name: typeof errorRecord.name === 'string' ? errorRecord.name : undefined,
      message:
        typeof errorRecord.message === 'string'
          ? errorRecord.message
          : String(error),
      stack:
        typeof errorRecord.stack === 'string' ? errorRecord.stack : undefined,
    };
  }

  return {
    message: String(error),
  };
}

export function logMv3ServiceWorkerDiagnostic(
  event: string,
  details: Record<string, unknown> = {},
) {
  if (
    !isMv3ServiceWorkerDiagnosticsEnabled() ||
    diagnosticLogCount >= MAX_DIAGNOSTIC_LOGS
  ) {
    return;
  }

  diagnosticLogCount += 1;

  const payload = {
    sequence: diagnosticLogCount,
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  try {
    console.log(DIAGNOSTIC_PREFIX, JSON.stringify(payload));
  } catch (error) {
    console.log(DIAGNOSTIC_PREFIX, event, {
      diagnosticSerializationError: getDiagnosticError(error),
    });
  }
}

export function addMv3ServiceWorkerDiagnosticErrorListeners() {
  if (
    !isMv3ServiceWorkerDiagnosticsEnabled() ||
    globalErrorListenersInstalled ||
    typeof globalThis.addEventListener !== 'function'
  ) {
    return;
  }

  globalErrorListenersInstalled = true;

  globalThis.addEventListener('error', (event) => {
    logMv3ServiceWorkerDiagnostic('global-error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: getDiagnosticError(event.error),
    });
  });

  globalThis.addEventListener('unhandledrejection', (event) => {
    logMv3ServiceWorkerDiagnostic('unhandled-rejection', {
      reason: getDiagnosticError(event.reason),
    });
  });
}
