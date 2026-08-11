import { Interface } from '@ethersproject/abi';
import namehash from 'eth-ens-namehash';

import {
  BNS_REGISTRY_RESOLVER_FRAGMENT,
  BNS_RESOLVER_CONTENTHASH_FRAGMENT,
} from '../../../../shared/bns/constants';
import { createBnsResolver } from './create-bns-resolver';

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

describe('createBnsResolver (H1.2)', () => {
  it('reports not configured and fails getConfig without registry', () => {
    const api = createBnsResolver({
      configSources: { registryAddress: '', rpcUrls: validRpcs },
    });
    expect(api.isConfigured()).toBe(false);
    expect(() => api.getConfig()).toThrow('not configured');
  });

  it('resolves through injected eth_call when config is valid', async () => {
    const node = namehash.hash('bear.bnes');
    const ethCall = jest.fn(async ({ to, data }: { to: string; data: string }) => {
      if (to.toLowerCase() === REGISTRY) {
        expect(data).toBe(
          registryInterface.encodeFunctionData('resolver', [node]),
        );
        return registryInterface.encodeFunctionResult('resolver', [RESOLVER]);
      }
      if (to.toLowerCase() === RESOLVER.toLowerCase()) {
        return resolverInterface.encodeFunctionResult('contenthash', [
          CONTENTHASH,
        ]);
      }
      throw new Error(`unexpected to ${to}`);
    });

    const api = createBnsResolver({
      configSources: {
        registryAddress: REGISTRY,
        gatewayHost: 'ipfs.bearnetwork.net',
        rpcUrls: validRpcs,
      },
      ethCall,
    });

    expect(api.isConfigured()).toBe(true);
    const result = await api.resolve('bear.bnes', 'index.html');
    expect(result.cid).toBe(CID);
    expect(result.gatewayUrl).toBe(
      `https://ipfs.bearnetwork.net/ipfs/${CID}/index.html`,
    );
    expect(ethCall).toHaveBeenCalledTimes(2);
  });

  it('fails closed on invalid host before eth_call', async () => {
    const ethCall = jest.fn();
    const api = createBnsResolver({
      configSources: {
        registryAddress: REGISTRY,
        rpcUrls: validRpcs,
      },
      ethCall,
    });

    await expect(api.resolve('-bad.bnes')).rejects.toThrow(
      'Invalid or disallowed',
    );
    expect(ethCall).not.toHaveBeenCalled();
  });
});
