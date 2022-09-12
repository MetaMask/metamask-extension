import Resolution from "@unstoppabledomains/resolution";

export default async function resolveUnsToIpfsContentId(domainName) {
    const resolution = new Resolution();
    const result = await resolution.ipfsHash(domainName);
    return result;
}   