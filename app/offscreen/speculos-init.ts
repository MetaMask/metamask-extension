import {
  installSpeculosWebHidMock,
  type SpeculosGlobals,
} from './speculos-webhid-mock';

const SPECULOS_WS_BRIDGE_PORT = 9876;

export async function initWebHIDMockForSpeculos(): Promise<void> {
  if (!process.env.IN_TEST) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const speculosWin = window as unknown as SpeculosGlobals['win'] & {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __speculosWS?: typeof WebSocket;
    };

    if (speculosWin.__speculosWebHIDMockInstalled) {
      return;
    }

    const WS = speculosWin.__speculosWS;
    if (!WS) {
      console.warn(
        '[Offscreen] No WebSocket constructor available for Speculos mock',
      );
      return;
    }

    installSpeculosWebHidMock(SPECULOS_WS_BRIDGE_PORT, {
      WS,
      win: speculosWin,
      nav: navigator,
    });
    console.log(
      '[Offscreen] WebHID mock initialized for Speculos on port',
      SPECULOS_WS_BRIDGE_PORT,
    );
  } catch (error) {
    console.error('[Offscreen] Failed to initialize WebHID mock:', error);
  }
}
