import { Interface } from '@ethersproject/abi';
import namehash from 'eth-ens-namehash';

import {
  BNS_REGISTRY_RESOLVER_FRAGMENT,
  BNS_RESOLVER_CONTENTHASH_FRAGMENT,
} from '../../../../shared/bns/constants';
import { createBnsResolver } from './create-bns-resolver';
import { resolveBnesForUi } from './resolve-for-ui';
import { resetBnsResolverForTests, setupBnsResolver } from './setup';

const REGISTRY = '0x2222222222222222222222222222222222222222';
const RESOLVER = '0x3333333333333333333333333333333333333333';
const CONTENTHASH =
  '0xe312209d6c2be50f70695347c6da90ab413d0fdd87c8f85b09b78d26718f61c3c7a70e';
const CID = 'QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF';

const registryInterface = new Interface([BNS_REGISTRY_RESOLVER_FRAGMENT]);
const resolverInterface = new Interface([BNS_RESOLVER_CONTENTHASH_FRAGMENT]);

const validRpcs = [
  'https://rpc-a.example',
  'https://rpc-b.example',
  'https://rpc-c.example',
] as const;

describe('resolveBnesForUi (H1.4)', () => {
  afterEach(() => {
    resetBnsResolverForTests();
  });

  it('returns a structured error when resolver is not installed', async () => {
    const display = await resolveBnesForUi({
      name: 'bear.bnes',
      resolver: null,
    });
    expect(display.ok).toBe(false);
    if (!display.ok) {
      expect(display.error).toMatch(/not installed/u);
      expect(display.renderInExtension).toBe(false);
    }
  });

  it('returns a structured error when registry is not configured', async () => {
    const resolver = createBnsResolver({
      configSources: { registryAddress: '', rpcUrls: validRpcs },
    });
    const display = await resolveBnesForUi({
      name: 'bear.bnes',
      resolver,
    });
    expect(display.ok).toBe(false);
    if (!display.ok) {
      expect(display.error).toMatch(/not configured/u);
      expect(display.renderInExtension).toBe(false);
    }
  });

  it('returns a display DTO with renderInExtension false on success', async () => {
    const node = namehash.hash('bear.bnes');
    const ethCall = jest.fn(async ({ to }: { to: string }) => {
      if (to.toLowerCase() === REGISTRY) {
        return registryInterface.encodeFunctionResult('resolver', [RESOLVER]);
      }
      return resolverInterface.encodeFunctionResult('contenthash', [
        CONTENTHASH,
      ]);
    });

    setupBnsResolver({
      configSources: {
        registryAddress: REGISTRY,
        gatewayHost: 'ipfs.bearnetwork.net',
        rpcUrls: validRpcs,
      },
      ethCall,
    });

    const display = await resolveBnesForUi({ name: 'bear.bnes' });
    expect(display).toStrictEqual({
      ok: true,
      host: 'bear.bnes',
      cid: CID,
      gatewayUrl: `https://ipfs.bearnetwork.net/ipfs/${CID}`,
      resolver: RESOLVER.toLowerCase(),
      renderInExtension: false,
    });
    expect(node).toMatch(/^0x/u);
  });
});
