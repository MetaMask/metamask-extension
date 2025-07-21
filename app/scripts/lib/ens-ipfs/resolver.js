import namehash from 'eth-ens-namehash';
import contentHash from '@ensdomains/content-hash';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import registryAbi from './contracts/registry';
import resolverAbi from './contracts/resolver';

export default async function resolveEnsToIpfsContentId({ provider, name }) {
  const hash = namehash.hash(name);

  // lookup registry
  const chainId = Number.parseInt(
    await provider.request({ method: 'net_version' }),
    10,
  );
  const registryAddress = getRegistryForChainId(chainId);
  if (!registryAddress) {
    throw new Error(
      `EnsIpfsResolver - no known ens-ipfs registry for chainId "${chainId}"`,
    );
  }
  const web3Provider = new Web3Provider(provider);
  const registryContract = new Contract(
    registryAddress,
    registryAbi,
    web3Provider,
  );
  // lookup resolver
  const resolverAddress = await registryContract.resolver(hash);
  if (hexValueIsEmpty(resolverAddress)) {
    throw new Error(`EnsIpfsResolver - no resolver found for name "${name}"`);
  }
  const resolverContract = new Contract(
    resolverAddress,
    resolverAbi,
    web3Provider,
  );

  const isEIP1577Compliant =
    await resolverContract.supportsInterface('0xbc1c58d1');
  const isLegacyResolver =
    await resolverContract.supportsInterface('0xd8389dc5');
  if (isEIP1577Compliant) {
    const contentLookupResult = await resolverContract.contenthash(hash);
    const rawContentHash = contentLookupResult[0];
    let decodedContentHash = contentHash.decode(rawContentHash);
    const type = contentHash.getCodec(rawContentHash);

    if (type === 'ipfs-ns' || type === 'ipns-ns') {
      decodedContentHash =
        contentHash.helpers.cidV0ToV1Base32(decodedContentHash);
    }

    return { type, hash: decodedContentHash };
  }
  if (isLegacyResolver) {
    // lookup content id
    const contentLookupResult = await resolverContract.content(hash);
    const content = contentLookupResult[0];
    if (hexValueIsEmpty(content)) {
      throw new Error(
        `EnsIpfsResolver - no content ID found for name "${name}"`,
      );
    }
    return { type: 'swarm-ns', hash: content.slice(2) };
  }
  throw new Error(
    `EnsIpfsResolver - the resolver for name "${name}" is not standard, it should either supports contenthash() or content()`,
  );
}

function hexValueIsEmpty(value) {
  return [
    undefined,
    null,
    '0x',
    '0x0',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ].includes(value);
}

/**
 * Returns the registry address for the given chain ID
 *
 * @param {number} chainId - the chain ID
 * @returns {string|null} the registry address if known, null otherwise
 */
function getRegistryForChainId(chainId) {
  switch (chainId) {
    case 1:
    case 3:
    case 4:
    case 5:
    case 6:
      // Mainnet and Goerli, respectively, use the same address
      return '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
    default:
      return null;
  }
}
