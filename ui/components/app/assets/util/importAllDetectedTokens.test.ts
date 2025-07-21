import { NetworkConfiguration } from '@metamask/network-controller';
import { Token } from '../types';
import { importAllDetectedTokens } from './importAllDetectedTokens';

describe('importAllDetectedTokens with PORTFOLIO_VIEW true', () => {
  let addImportedTokensMock: jest.Mock;
  let trackTokenAddedEventMock: jest.Mock;

  beforeEach(() => {
    process.env.PORTFOLIO_VIEW = 'true';
    addImportedTokensMock = jest.fn(() => Promise.resolve());
    trackTokenAddedEventMock = jest.fn();
  });

  it('should process multichain tokens when not on current network', async () => {
    const isOnCurrentNetwork = false;
    const detectedTokensMultichain = {
      '0x1': [{ symbol: 'ABC' }, { symbol: 'DEF' }],
      '0x2': [{ symbol: 'GHI' }],
    } as unknown as Record<string, Token[]>;

    const allNetworks = {
      '0x1': {
        chainId: 'chain-1',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'net-1' }],
      },
      '0x2': {
        chainId: 'chain-2',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'net-2' }],
      },
    } as unknown as Record<string, NetworkConfiguration>;

    const networkClientId = 'default-net';
    const currentChainId = 'current-chain';
    const detectedTokens: Token[] = [];

    await importAllDetectedTokens(
      isOnCurrentNetwork,
      detectedTokensMultichain,
      allNetworks,
      networkClientId,
      currentChainId,
      detectedTokens,
      addImportedTokensMock,
      trackTokenAddedEventMock,
    );

    expect(addImportedTokensMock).toHaveBeenCalledTimes(2);
    expect(addImportedTokensMock).toHaveBeenCalledWith(
      detectedTokensMultichain['0x1'],
      'net-1',
    );
    expect(addImportedTokensMock).toHaveBeenCalledWith(
      detectedTokensMultichain['0x2'],
      'net-2',
    );

    expect(trackTokenAddedEventMock).toHaveBeenCalledTimes(3);
    expect(trackTokenAddedEventMock).toHaveBeenCalledWith(
      { symbol: 'ABC' },
      'chain-1',
    );
    expect(trackTokenAddedEventMock).toHaveBeenCalledWith(
      { symbol: 'DEF' },
      'chain-1',
    );
    expect(trackTokenAddedEventMock).toHaveBeenCalledWith(
      { symbol: 'GHI' },
      'chain-2',
    );
  });

  it('should process single-chain tokens when on current network', async () => {
    const isOnCurrentNetwork = true;
    const detectedTokensMultichain = {
      '0x1': [{ symbol: 'ABC' }],
    } as unknown as Record<string, Token[]>;

    const allNetworks = {
      '0x1': {
        chainId: 'chain-1',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'net-1' }],
      },
    } as unknown as Record<string, NetworkConfiguration>;

    const networkClientId = 'default-net';
    const currentChainId = 'current-chain';
    const detectedTokens: Token[] = [
      { symbol: 'XYZ' },
      { symbol: 'LMN' },
    ] as unknown as Token[];

    await importAllDetectedTokens(
      isOnCurrentNetwork,
      detectedTokensMultichain,
      allNetworks,
      networkClientId,
      currentChainId,
      detectedTokens,
      addImportedTokensMock,
      trackTokenAddedEventMock,
    );

    expect(addImportedTokensMock).toHaveBeenCalledTimes(1);
    expect(addImportedTokensMock).toHaveBeenCalledWith(
      detectedTokens,
      networkClientId,
    );

    expect(trackTokenAddedEventMock).toHaveBeenCalledTimes(2);
    expect(trackTokenAddedEventMock).toHaveBeenCalledWith(
      { symbol: 'XYZ' },
      currentChainId,
    );
    expect(trackTokenAddedEventMock).toHaveBeenCalledWith(
      { symbol: 'LMN' },
      currentChainId,
    );
  });

  it('should do nothing if no tokens are detected', async () => {
    const isOnCurrentNetwork = true;
    const detectedTokensMultichain = {};
    const allNetworks = {};

    const networkClientId = 'default-net';
    const currentChainId = 'current-chain';
    const detectedTokens: Token[] = [];

    await importAllDetectedTokens(
      isOnCurrentNetwork,
      detectedTokensMultichain,
      allNetworks,
      networkClientId,
      currentChainId,
      detectedTokens,
      addImportedTokensMock,
      trackTokenAddedEventMock,
    );

    expect(addImportedTokensMock).not.toHaveBeenCalled();
    expect(trackTokenAddedEventMock).not.toHaveBeenCalled();
  });

  it('should skip tokens for a network when chain configuration is missing', async () => {
    const isOnCurrentNetwork = false;
    const detectedTokensMultichain = {
      '0x1': [{ symbol: 'ABC' }],
      '0x2': [{ symbol: 'GHI' }],
    } as unknown as Record<string, Token[]>;

    const allNetworks = {
      '0x1': {
        chainId: 'chain-1',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'net-1' }],
      },
    } as unknown as Record<string, NetworkConfiguration>;

    const networkClientId = 'default-net';
    const currentChainId = 'current-chain';
    const detectedTokens: Token[] = [];

    await importAllDetectedTokens(
      isOnCurrentNetwork,
      detectedTokensMultichain,
      allNetworks,
      networkClientId,
      currentChainId,
      detectedTokens,
      addImportedTokensMock,
      trackTokenAddedEventMock,
    );

    expect(addImportedTokensMock).toHaveBeenCalledTimes(1);
    expect(addImportedTokensMock).toHaveBeenCalledWith(
      detectedTokensMultichain['0x1'],
      'net-1',
    );

    expect(trackTokenAddedEventMock).toHaveBeenCalledTimes(1);
    expect(trackTokenAddedEventMock).toHaveBeenCalledWith(
      { symbol: 'ABC' },
      'chain-1',
    );
  });
});
