import Resolution from '@unstoppabledomains/resolution';
/**
 * Resolves an Unstoppable Domain into an IPFS Website Hash
 *
 * @param {string} domainName - a Valid Unstoppable Domain Name
 */
export default async function resolveUnsToIpfsContentId(domainName) {
  const resolution = new Resolution();
  const result = await resolution.ipfsHash(domainName);
  return result;
}
