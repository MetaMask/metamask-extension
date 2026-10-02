import { MPC_KEYRING_TYPE } from '../../../../shared/constants/mpc-keyring';
import {
  buildMpcKeyringBuilder,
  type MpcKeyringBuilderMessenger,
} from './mpc-keyring-builder';

jest.mock('@metamask/eth-mpc-keyring', () => ({
  MPCKeyring: jest.fn(),
}));

jest.mock('@metamask/tss-dkls23-lib', () => ({
  loadSync: () => ({}),
}));

const mpcKeyringModule = jest.requireMock(
  '@metamask/eth-mpc-keyring',
) as Record<string, jest.Mock>;
const mpcKeyringConstructor = mpcKeyringModule.MPCKeyring;

describe('buildMpcKeyringBuilder', () => {
  it('is keyed by the MPC keyring type', () => {
    const builder = buildMpcKeyringBuilder({} as MpcKeyringBuilderMessenger);

    expect(builder.type).toBe(MPC_KEYRING_TYPE);
  });

  it('passes the WebSocket constructor into the keyring', () => {
    const builder = buildMpcKeyringBuilder({} as MpcKeyringBuilderMessenger);

    builder();

    expect(mpcKeyringConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        webSocket: globalThis.WebSocket,
      }),
    );
  });
});
