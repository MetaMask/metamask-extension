import {
  installSpeculosWebHidMock,
  SPECULOS_WS_BRIDGE_PORT,
  type SpeculosGlobals,
} from '../../shared/lib/speculos-webhid-mock';

const win = window as unknown as SpeculosGlobals['win'];

installSpeculosWebHidMock(SPECULOS_WS_BRIDGE_PORT, {
  WS: WebSocket,
  win,
  nav: navigator,
});
