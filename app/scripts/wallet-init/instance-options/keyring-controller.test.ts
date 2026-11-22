import type { Encryptor } from '@metamask/keyring-controller';
import { getKeyringBuilders, getKeyringV2Builders } from '../keyrings';
import { createMockMessenger } from '../test-utils';
import { getKeyringControllerInstanceOptions } from './keyring-controller';

jest.mock('../keyrings', () => ({
  getKeyringBuilders: jest.fn(() => ['v1-builder']),
  getKeyringV2Builders: jest.fn(() => ['v2-builder']),
}));

describe('getKeyringControllerInstanceOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds options with the injected encryptor and the V1/V2 keyring builders', () => {
    const messenger = createMockMessenger();
    const encryptor = { name: 'mock-encryptor' } as unknown as Encryptor;

    const options = getKeyringControllerInstanceOptions({
      messenger,
      encryptor,
    });

    expect(getKeyringBuilders).toHaveBeenCalledWith(messenger);
    expect(getKeyringV2Builders).toHaveBeenCalled();
    expect(options).toStrictEqual({
      encryptor,
      keyringBuilders: ['v1-builder'],
      keyringV2Builders: ['v2-builder'],
    });
  });

  it('leaves the encryptor undefined when not supplied', () => {
    const options = getKeyringControllerInstanceOptions({
      messenger: createMockMessenger(),
    });

    expect(options.encryptor).toBeUndefined();
  });
});
