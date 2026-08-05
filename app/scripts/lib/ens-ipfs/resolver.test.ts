import { Contract } from '@ethersproject/contracts';
import contentHash from '@ensdomains/content-hash';
import resolveEnsToIpfsContentId, { type EthProvider } from './resolver';

jest.mock('@ethersproject/providers', () => ({
  Web3Provider: jest.fn(),
}));

jest.mock('@ethersproject/contracts', () => ({
  Contract: jest.fn(),
}));

jest.mock('eth-ens-namehash', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    hash: jest.fn(() => '0xnamehash'),
  },
}));

jest.mock('@ensdomains/content-hash', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    decode: jest.fn(),
    getCodec: jest.fn(),
    helpers: {
      cidV0ToV1Base32: jest.fn((cid: string) => `v1-${cid}`),
    },
  },
}));

const mockContract = Contract as jest.MockedClass<typeof Contract>;
const mockContentHash = contentHash as jest.Mocked<typeof contentHash>;
const mockCidV0ToV1Base32 = jest.mocked(contentHash.helpers.cidV0ToV1Base32);

const EMPTY_HEX =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const RESOLVER_ADDRESS = '0x1111111111111111111111111111111111111111';

function createProvider(netVersion: string): EthProvider {
  return {
    request: jest.fn().mockResolvedValue(netVersion),
  } as unknown as EthProvider;
}

function mockRegistryAndResolver({
  resolverAddress = RESOLVER_ADDRESS,
  supportsInterface,
  contenthash,
  content,
}: {
  resolverAddress?: string;
  supportsInterface: (interfaceId: string) => Promise<boolean>;
  contenthash?: jest.Mock;
  content?: jest.Mock;
}) {
  const registryContract = {
    resolver: jest.fn().mockResolvedValue(resolverAddress),
  };
  const resolverContract = {
    supportsInterface: jest.fn((interfaceId: string) =>
      supportsInterface(interfaceId),
    ),
    contenthash: contenthash ?? jest.fn().mockResolvedValue(undefined),
    content: content ?? jest.fn().mockResolvedValue(undefined),
  };

  let callCount = 0;
  mockContract.mockImplementation(() => {
    callCount += 1;
    if (callCount === 1) {
      return registryContract as never;
    }
    if (callCount === 2) {
      return resolverContract as never;
    }
    throw new Error(`Unexpected Contract construction #${callCount}`);
  });

  return { registryContract, resolverContract };
}

describe('resolveEnsToIpfsContentId', () => {
  beforeEach(() => {
    mockContract.mockReset();
    mockContentHash.decode.mockReset();
    mockContentHash.getCodec.mockReset();
    mockCidV0ToV1Base32.mockReset();
    mockCidV0ToV1Base32.mockImplementation((cid: string) => `v1-${cid}`);
  });

  it('throws when the chain has no known ENS registry', async () => {
    await expect(
      resolveEnsToIpfsContentId({
        provider: createProvider('999'),
        name: 'vitalik.eth',
      }),
    ).rejects.toThrow(
      'EnsIpfsResolver - no known ens-ipfs registry for chainId "999"',
    );
  });

  it('throws when no resolver is registered for the name', async () => {
    mockRegistryAndResolver({
      resolverAddress: EMPTY_HEX,
      supportsInterface: async () => false,
    });

    await expect(
      resolveEnsToIpfsContentId({
        provider: createProvider('1'),
        name: 'vitalik.eth',
      }),
    ).rejects.toThrow(
      'EnsIpfsResolver - no resolver found for name "vitalik.eth"',
    );
  });

  it('resolves EIP-1577 ipfs contenthash and converts cid to v1 base32', async () => {
    const rawContentHash = '0xipfsraw';
    mockRegistryAndResolver({
      supportsInterface: async (interfaceId) => interfaceId === '0xbc1c58d1',
      contenthash: jest.fn().mockResolvedValue(rawContentHash),
    });
    mockContentHash.decode.mockReturnValue('QmOldCid');
    mockContentHash.getCodec.mockReturnValue('ipfs-ns');

    const result = await resolveEnsToIpfsContentId({
      provider: createProvider('1'),
      name: 'vitalik.eth',
    });

    expect(result).toStrictEqual({ type: 'ipfs-ns', hash: 'v1-QmOldCid' });
    expect(mockCidV0ToV1Base32).toHaveBeenCalledWith('QmOldCid');
  });

  it('resolves EIP-1577 ipns contenthash with cid conversion', async () => {
    mockRegistryAndResolver({
      supportsInterface: async (interfaceId) => interfaceId === '0xbc1c58d1',
      contenthash: jest.fn().mockResolvedValue('0xipnsraw'),
    });
    mockContentHash.decode.mockReturnValue('k51Old');
    mockContentHash.getCodec.mockReturnValue('ipns-ns');

    const result = await resolveEnsToIpfsContentId({
      provider: createProvider('5'),
      name: 'docs.eth',
    });

    expect(result).toStrictEqual({ type: 'ipns-ns', hash: 'v1-k51Old' });
  });

  it('resolves EIP-1577 contenthash without cid conversion for other codecs', async () => {
    mockRegistryAndResolver({
      supportsInterface: async (interfaceId) => interfaceId === '0xbc1c58d1',
      contenthash: jest.fn().mockResolvedValue('0xother'),
    });
    mockContentHash.decode.mockReturnValue('onionhash');
    mockContentHash.getCodec.mockReturnValue('onion');

    const result = await resolveEnsToIpfsContentId({
      provider: createProvider('1'),
      name: 'onion.eth',
    });

    expect(result).toStrictEqual({ type: 'onion', hash: 'onionhash' });
    expect(mockCidV0ToV1Base32).not.toHaveBeenCalled();
  });

  it('resolves legacy swarm content()', async () => {
    mockRegistryAndResolver({
      supportsInterface: async (interfaceId) => interfaceId === '0xd8389dc5',
      content: jest
        .fn()
        .mockResolvedValue(
          '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        ),
    });

    const result = await resolveEnsToIpfsContentId({
      provider: createProvider('1'),
      name: 'swarm.eth',
    });

    expect(result).toStrictEqual({
      type: 'swarm-ns',
      hash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    });
  });

  it('throws when legacy content() is empty', async () => {
    mockRegistryAndResolver({
      supportsInterface: async (interfaceId) => interfaceId === '0xd8389dc5',
      content: jest.fn().mockResolvedValue('0x'),
    });

    await expect(
      resolveEnsToIpfsContentId({
        provider: createProvider('1'),
        name: 'empty.eth',
      }),
    ).rejects.toThrow(
      'EnsIpfsResolver - no content ID found for name "empty.eth"',
    );
  });

  it('throws when the resolver supports neither contenthash nor content', async () => {
    mockRegistryAndResolver({
      supportsInterface: async () => false,
    });

    await expect(
      resolveEnsToIpfsContentId({
        provider: createProvider('1'),
        name: 'nonstandard.eth',
      }),
    ).rejects.toThrow(
      'EnsIpfsResolver - the resolver for name "nonstandard.eth" is not standard, it should either supports contenthash() or content()',
    );
  });
});
