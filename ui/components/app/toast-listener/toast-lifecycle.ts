type ToastPhase = 'approvedOrSigned' | 'pending' | 'terminal';

const toastPhaseById = new Map<string, ToastPhase>();

export function setApprovedOrSignedToastPhase(id: string) {
  if (toastPhaseById.has(id)) {
    return;
  }

  toastPhaseById.set(id, 'approvedOrSigned');
}

export function shouldShowPendingToast(id: string) {
  const phase = toastPhaseById.get(id);
  const isApprovedOrSignedOrUndefined = phase === 'approvedOrSigned' || phase === undefined;

  if (!isApprovedOrSignedOrUndefined) {
    return false;
  }

  toastPhaseById.set(id, 'pending');
  return true;
}

export function shouldShowTerminalToast(id: string) {
  const phase = toastPhaseById.get(id);
  const isApprovedOrSignedOrPending = phase === 'approvedOrSigned' || phase === 'pending';

  if (!isApprovedOrSignedOrPending) {
    return false;
  }

  toastPhaseById.set(id, 'terminal');
  return true;
}

export function clearToastPhase(id: string) {
  toastPhaseById.delete(id);
}
