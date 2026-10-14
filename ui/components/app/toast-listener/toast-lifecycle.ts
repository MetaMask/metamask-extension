type ToastPhase = 'pending' | 'terminal';

const toastPhaseById = new Map<string, ToastPhase>();

export function shouldShowPendingToast(id: string) {
  if (toastPhaseById.get(id) !== undefined) {
    return false;
  }

  toastPhaseById.set(id, 'pending');
  return true;
}

export function shouldShowTerminalToast(id: string) {
  if (toastPhaseById.get(id) !== 'pending') {
    return false;
  }

  toastPhaseById.set(id, 'terminal');
  return true;
}

// Failed toasts may fire with no prior pending toast (publish/RPC failure
// never reaches `submitted`).
export function shouldShowFailedToast(id: string) {
  if (toastPhaseById.get(id) === 'terminal') {
    return false;
  }

  toastPhaseById.set(id, 'terminal');
  return true;
}

export function clearToastPhase(id: string) {
  toastPhaseById.delete(id);
}
