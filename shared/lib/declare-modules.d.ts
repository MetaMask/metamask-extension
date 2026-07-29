declare module 'human-standard-token-abi';

declare module 'eth-ens-namehash' {
  function hash(name: string): string;
  function normalize(name: string): string;

  export { hash, normalize };
  export default { hash, normalize };
}

declare module '@ensdomains/content-hash' {
  const contentHash: {
    decode: (contentHash: string) => string;
    encode: (codec: string, value: string) => string;
    getCodec: (contentHash: string) => string;
    helpers: {
      cidV0ToV1Base32: (cid: string) => string;
    };
  };

  export default contentHash;
}
