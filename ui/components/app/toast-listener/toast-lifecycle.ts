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

export function clearToastPhase(id: string) {
  toastPhaseById.delete(id);
}
