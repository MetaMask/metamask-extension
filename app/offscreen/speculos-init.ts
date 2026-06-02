import {
  installSpeculosWebHidMock,
  SPECULOS_WS_BRIDGE_PORT,
  type SpeculosGlobals,
} from '../../shared/lib/speculos-webhid-mock';

export async function initWebHIDMockForSpeculos(): Promise<void> {
  if (!process.env.IN_TEST) {
    return;
  }

  try {
    const speculosWin = window as unknown as SpeculosGlobals['win'];

    installSpeculosWebHidMock(SPECULOS_WS_BRIDGE_PORT, {
      WS: WebSocket,
      win: speculosWin,
      nav: navigator,
    });
  } catch (error) {
    console.error('[Offscreen] Failed to initialize WebHID mock:', error);
  }
}
