import { Mockttp } from 'mockttp';

const scanResponse = {
  resultType: 'Benign',
  reason: '',
  description: '',
  features: [],
};

export const mockStellarMessageScan = (mockServer: Mockttp) =>
  mockServer
    .forPost(/https:\/\/security-alerts\.api\.cx\.metamask\.io\//u)
    .thenJson(200, scanResponse);

export const mockStellarTransactionScan = (mockServer: Mockttp) =>
  mockStellarMessageScan(mockServer);
