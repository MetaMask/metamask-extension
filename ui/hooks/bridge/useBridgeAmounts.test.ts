import { useEffect } from 'react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import useBridgeAmounts from './useBridgeAmounts';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import { mockBridgeQuotes_native_native } from '../../../test/data/bridge/mock-quotes-native-native';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { useDispatch } from 'react-redux';
import { setToChain, setToToken } from '../../ducks/bridge/actions';
import { mockNetworkState } from '../../../test/stub/networks';
import { mockBridgeQuotes_native_erc20 } from '../../../test/data/bridge/mock-quotes-native-erc20';
import { mockBridgeQuotes_erc20_erc20 } from '../../../test/data/bridge/mock-quotes-erc20-erc20';
import { mockBridgeQuotes_erc20_native } from '../../../test/data/bridge/mock-quotes-erc20-native';

const mockFetchTokenExchangeRates = jest.fn();
jest.mock('../../helpers/utils/util', () => ({
  ...jest.requireActual('../../helpers/utils/util'),
  fetchTokenExchangeRates: (...a) => mockFetchTokenExchangeRates(...a),
}));

const renderUseBridgeAmounts = (mockStoreState: any) =>
  renderHookWithProvider(() => {
    const dispatch = useDispatch();
    useEffect(() => {
      dispatch(setToChain(mockStoreState.bridge.toChainId));
      dispatch(setToToken(mockStoreState.bridge.toToken));
    }, [mockStoreState.bridge.toToken, mockStoreState.bridge.toChainId]);

    const amounts = useBridgeAmounts();
    return amounts;
  }, mockStoreState);

describe('useBridgeAmounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct token and fiat values, native -> native', async () => {
    mockFetchTokenExchangeRates.mockReturnValue(
      Promise.resolve({
        '0x0000000000000000000000000000000000000000': 1.1,
      }),
    );

    const { result, waitForNextUpdate } = renderUseBridgeAmounts(
      createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: [CHAIN_IDS.MAINNET],
          destNetworkAllowlist: [CHAIN_IDS.POLYGON],
        },
        {
          toChainId: CHAIN_IDS.POLYGON,
          toToken: { address: '0x0000000000000000000000000000000000000000' },
        },
        { quotes: mockBridgeQuotes_native_native },
        {
          currencyRates: {
            ETH: {
              conversionRate: 11.1,
            },
          },
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      ),
    );

    await waitForNextUpdate();

    expect(mockFetchTokenExchangeRates).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenExchangeRates).toHaveBeenCalledWith(
      'POL',
      ['0x0000000000000000000000000000000000000000'],
      CHAIN_IDS.POLYGON,
    );
    expect(
      result.current.toAmount[
        '61f0c14f-897c-42f2-9731-bce420d028b2'
      ].raw.toString(),
    ).toStrictEqual('31.750754963454468106');
    expect(
      result.current.toAmount[
        '61f0c14f-897c-42f2-9731-bce420d028b2'
      ].fiat.toString(),
    ).toStrictEqual('34.9258304597999149166');
    expect(
      result.current.toAmount[
        '2899535137f42c608a5a352ac19d34f8'
      ].raw.toString(),
    ).toStrictEqual('31.946993619827368646');
    expect(
      result.current.toAmount[
        '2899535137f42c608a5a352ac19d34f8'
      ].fiat.toString(),
    ).toStrictEqual('35.1416929818101055106');
  });

  it('should return the correct token and fiat values, native -> erc20', async () => {
    mockFetchTokenExchangeRates.mockReturnValue(
      Promise.resolve({
        '0x0000000000000000000000000000000000000000': 1.1,
        '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 2.3,
      }),
    );

    const { result, waitForNextUpdate } = renderUseBridgeAmounts(
      createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
          destNetworkAllowlist: [CHAIN_IDS.POLYGON],
        },
        {
          toChainId: CHAIN_IDS.POLYGON,
          toToken: { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' },
        },
        { quotes: mockBridgeQuotes_native_erc20 },
        {
          currencyRates: {
            ETH: {
              conversionRate: 11.1,
            },
          },
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      ),
    );

    await waitForNextUpdate();

    expect(mockFetchTokenExchangeRates).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenExchangeRates).toHaveBeenCalledWith(
      'POL',
      ['0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'],
      CHAIN_IDS.POLYGON,
    );

    expect(
      result.current.toAmount[
        '381c23bc-e3e4-48fe-bc53-257471e388ad'
      ].raw.toString(),
    ).toStrictEqual('24.438902');
    expect(
      result.current.toAmount[
        '381c23bc-e3e4-48fe-bc53-257471e388ad'
      ].fiat.toString(),
    ).toStrictEqual('61.83042206');
    expect(
      result.current.relayerFees[
        '381c23bc-e3e4-48fe-bc53-257471e388ad'
      ].raw.toString(),
    ).toStrictEqual('0.001');
    expect(
      result.current.relayerFees[
        '381c23bc-e3e4-48fe-bc53-257471e388ad'
      ].fiat.toString(),
    ).toStrictEqual('0.0111');

    expect(
      result.current.toAmount[
        '4277a368-40d7-4e82-aa67-74f29dc5f98a'
      ].raw.toString(),
    ).toStrictEqual('24.256223');
    expect(
      result.current.toAmount[
        '4277a368-40d7-4e82-aa67-74f29dc5f98a'
      ].fiat.toString(),
    ).toStrictEqual('61.36824419');
    expect(
      result.current.relayerFees[
        '4277a368-40d7-4e82-aa67-74f29dc5f98a'
      ].raw.toString(),
    ).toStrictEqual('0.001');
    expect(
      result.current.relayerFees[
        '4277a368-40d7-4e82-aa67-74f29dc5f98a'
      ].fiat.toString(),
    ).toStrictEqual('0.0111');
  });

  it('should return the correct token and fiat values, erc20 -> erc20', async () => {
    mockFetchTokenExchangeRates.mockReturnValue(
      Promise.resolve({
        '0x0000000000000000000000000000000000000000': 1.1,
        '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 2.3,
      }),
    );

    const { result, waitForNextUpdate } = renderUseBridgeAmounts(
      createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
          destNetworkAllowlist: [CHAIN_IDS.POLYGON],
        },
        {
          toChainId: CHAIN_IDS.POLYGON,
          toToken: { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' },
        },
        { quotes: mockBridgeQuotes_erc20_erc20 },
        {
          currencyRates: {
            ETH: {
              conversionRate: 11.1,
            },
          },
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      ),
    );

    await waitForNextUpdate();

    expect(mockFetchTokenExchangeRates).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenExchangeRates).toHaveBeenCalledWith(
      'POL',
      ['0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'],
      CHAIN_IDS.POLYGON,
    );

    expect(
      result.current.toAmount[
        '90ae8e69-f03a-4cf6-bab7-ed4e3431eb37'
      ].raw.toString(),
    ).toStrictEqual('13.98428');
    expect(
      result.current.toAmount[
        '90ae8e69-f03a-4cf6-bab7-ed4e3431eb37'
      ].fiat.toString(),
    ).toStrictEqual('35.3802284');
    expect(
      result.current.toAmount[
        '0b6caac9-456d-47e6-8982-1945ae81ae82'
      ].raw.toString(),
    ).toStrictEqual('13.8');
    expect(
      result.current.toAmount[
        '0b6caac9-456d-47e6-8982-1945ae81ae82'
      ].fiat.toString(),
    ).toStrictEqual('34.914');
  });

  it('should return the correct token and fiat values, erc20 -> native', async () => {
    mockFetchTokenExchangeRates.mockReturnValue(
      Promise.resolve({
        '0x0000000000000000000000000000000000000000': 1.1,
      }),
    );

    const { result, waitForNextUpdate } = renderUseBridgeAmounts(
      createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
          destNetworkAllowlist: [CHAIN_IDS.ARBITRUM],
        },
        {
          toChainId: CHAIN_IDS.ARBITRUM,
          toToken: { address: '0x0000000000000000000000000000000000000000' },
        },
        { quotes: mockBridgeQuotes_erc20_native },
        {
          currencyRates: {
            ETH: {
              conversionRate: 11.1,
            },
          },
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.ARBITRUM },
          ),
        },
      ),
    );

    await waitForNextUpdate();

    expect(mockFetchTokenExchangeRates).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenExchangeRates).toHaveBeenCalledWith(
      'ETH',
      ['0x0000000000000000000000000000000000000000'],
      CHAIN_IDS.ARBITRUM,
    );

    expect(
      result.current.toAmount[
        'c2bc66c3-af0b-49b1-be2c-a80b934ce451'
      ].raw.toString(),
    ).toStrictEqual('0.005637223796141322');
    expect(
      result.current.toAmount[
        'c2bc66c3-af0b-49b1-be2c-a80b934ce451'
      ].fiat.toString(),
    ).toStrictEqual('0.0062009461757554542');
    expect(
      result.current.relayerFees[
        'c2bc66c3-af0b-49b1-be2c-a80b934ce451'
      ].raw.toString(),
    ).toStrictEqual('0');
    expect(
      result.current.relayerFees[
        'c2bc66c3-af0b-49b1-be2c-a80b934ce451'
      ].fiat.toString(),
    ).toStrictEqual('0');

    expect(
      result.current.toAmount[
        'd90df587-99c1-4b3b-ba9d-235248d6d45e'
      ].raw.toString(),
    ).toStrictEqual('0.00566');
    expect(
      result.current.toAmount[
        'd90df587-99c1-4b3b-ba9d-235248d6d45e'
      ].fiat.toString(),
    ).toStrictEqual('0.006226');
    expect(
      result.current.relayerFees[
        'd90df587-99c1-4b3b-ba9d-235248d6d45e'
      ].raw.toString(),
    ).toStrictEqual('0.000036854275051583');
    expect(
      result.current.relayerFees[
        'd90df587-99c1-4b3b-ba9d-235248d6d45e'
      ].fiat.toString(),
    ).toStrictEqual('0.0004090824530725713');
  });
  it.skip('should return token values when fiat is not available', () => {});
});
