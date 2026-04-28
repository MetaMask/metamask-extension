type DappRequestFrameContext = {
  frameId?: number;
  frameOrigin?: string;
  mainFrameOrigin?: string;
};

const frameContextByRequestId = new Map<string, DappRequestFrameContext>();

export function setDappRequestFrameContext({
  requestId,
  frameId,
  frameOrigin,
  mainFrameOrigin,
}: DappRequestFrameContext & { requestId: string }) {
  if (
    typeof frameId !== 'number' &&
    typeof frameOrigin !== 'string' &&
    typeof mainFrameOrigin !== 'string'
  ) {
    return;
  }

  frameContextByRequestId.set(requestId, {
    ...(typeof frameId === 'number' ? { frameId } : {}),
    ...(typeof frameOrigin === 'string' ? { frameOrigin } : {}),
    ...(typeof mainFrameOrigin === 'string' ? { mainFrameOrigin } : {}),
  });
}

export function getDappRequestFrameContext(requestId: string | undefined) {
  if (!requestId) {
    return undefined;
  }

  return frameContextByRequestId.get(requestId);
}

export function consumeDappRequestFrameContext(requestId: string | undefined) {
  if (!requestId) {
    return undefined;
  }

  const frameContext = frameContextByRequestId.get(requestId);
  frameContextByRequestId.delete(requestId);
  return frameContext;
}
