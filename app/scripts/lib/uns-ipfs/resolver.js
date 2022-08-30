import Resolution from "@unstoppabledomains/resolution";

export default async function resolveUnsToIpfsContentId(domainName) {
    let result;
    const resolution = new Resolution();
    result = await resolution.ipfsHash(domainName);
    return result;
}   