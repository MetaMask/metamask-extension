import { Mockttp } from 'mockttp';

export const mockStellarTokens = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https?:\/\/tokens\.api\.cx\.metamask\.io\/v3\/chains\/stellar:pubnet\/assets/u,
    )
    .thenJson(200, []);

export const mockStellarStaticAssets = (mockServer: Mockttp) =>
  mockServer
    .forGet(/^https:\/\/static\.api\.cx\.metamask\.io\//u)
    .thenReply(200, '');

export const mockStellarWalletIcons = (mockServer: Mockttp) =>
  mockServer
    .forGet(/^https:\/\/stellar\.creit\.tech\//u)
    .thenReply(200, '');
