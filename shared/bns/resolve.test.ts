import { Interface } from '@ethersproject/abi';
import namehash from 'eth-ens-namehash';

import {
  BNS_REGISTRY_RESOLVER_FRAGMENT,
  BNS_RESOLVER_CONTENTHASH_FRAGMENT,
} from './constants';
import { resolveBnesContent } from './resolve';

const REGISTRY = '0x2222222222222222222222222222222222222222';
const RESOLVER = '0x3333333333333333333333333333333333333333';
const CONTENTHASH =
  '0xe312209d6c2be50f70695347c6da90ab413d0fdd87c8f85b09b78d26718f61c3c7a70e';
const CID = 'QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF';

const registryInterface = new Interface([BNS_REGISTRY_RESOLVER_FRAGMENT]);
const resolverInterface = new Interface([BNS_RESOLVER_CONTENTHASH_FRAGMENT]);

describe('shared/bns resolveBnesContent', () => {
  it('resolves a valid .bnes name through registry → contenthash → gateway URL', async () => {
    const node = namehash.hash('bear.bnes');
    const ethCall = jest.fn(async ({ to, data }: { to: string; data: string }) => {
      if (to.toLowerCase() === REGISTRY.toLowerCase()) {
        expect(data).toBe(
          registryInterface.encodeFunctionData('resolver', [node]),
        );
        return registryInterface.encodeFunctionResult('resolver', [RESOLVER]);
      }
      if (to.toLowerCase() === RESOLVER.toLowerCase()) {
        expect(data).toBe(
          resolverInterface.encodeFunctionData('contenthash', [node]),
        );
        return resolverInterface.encodeFunctionResult('contenthash', [
          CONTENTHASH,
        ]);
      }
      throw new Error(`unexpected eth_call to ${to}`);
    });

    const result = await resolveBnesContent({
      name: 'bnes://bear.bnes/index.html',
      registryAddress: REGISTRY,
      ethCall,
      path: 'index.html',
    });

    expect(result).toMatchObject({
      host: 'bear.bnes',
      resolver: RESOLVER.toLowerCase(),
      cid: CID,
      gatewayUrl: `https://ipfs.bearnetwork.net/ipfs/${CID}/index.html`,
    });
    expect(ethCall).toHaveBeenCalledTimes(2);
  });

  it('fails closed for invalid hosts, missing registry, and empty contenthash', async () => {
    await expect(
      resolveBnesContent({
        name: '-bad.bnes',
        registryAddress: REGISTRY,
        ethCall: jest.fn(),
      }),
    ).rejects.toThrow('Invalid or disallowed');

    await expect(
      resolveBnesContent({
        name: 'bear.bnes',
        registryAddress: '0x0000000000000000000000000000000000000000',
        ethCall: jest.fn(),
      }),
    ).rejects.toThrow('registry address is not configured');

    const emptyContent = jest.fn(async ({ to }: { to: string }) => {
      if (to.toLowerCase() === REGISTRY.toLowerCase()) {
        return registryInterface.encodeFunctionResult('resolver', [RESOLVER]);
      }
      return resolverInterface.encodeFunctionResult('contenthash', ['0x']);
    });

    await expect(
      resolveBnesContent({
        name: 'bear.bnes',
        registryAddress: REGISTRY,
        ethCall: emptyContent,
      }),
    ).rejects.toThrow('No contenthash');
  });

  it('rejects non-IPFS contenthash payloads after chain read', async () => {
    const ethCall = jest.fn(async ({ to }: { to: string }) => {
      if (to.toLowerCase() === REGISTRY.toLowerCase()) {
        return registryInterface.encodeFunctionResult('resolver', [RESOLVER]);
      }
      // 0xe4 is not ipfs-ns
      return resolverInterface.encodeFunctionResult('contenthash', ['0xe4abcd']);
    });

    await expect(
      resolveBnesContent({
        name: 'bear.bnes',
        registryAddress: REGISTRY,
        ethCall,
      }),
    ).rejects.toThrow('not a valid IPFS CID payload');
  });
});
