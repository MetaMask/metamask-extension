import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import { getNetworkConfigurationsByChainId, getTokenList } from '../selectors';
import useTokenListPolling from './useTokenListPolling';
import useMultiPolling from './useMultiPolling';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
  getTokenList: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  tokenListStartPolling: jest.fn(),
  tokenListStopPollingByPollingToken: jest.fn(),
}));

jest.mock('./useMultiPolling');

const mockedGetNetworkConfigurationsByChainId =
  getNetworkConfigurationsByChainId as unknown as jest.Mock;
const mockedGetTokenList = getTokenList as jest.Mock;
const mockedUseMultiPolling = useMultiPolling as jest.Mock;

const testCases = [
  {
    networkConfigurations: { '1': {}, '2': {} },
    tokenList: [{ token: 'token1' }, { token: 'token2' }],
    expectedInput: ['1', '2'],
  },
  {
    networkConfigurations: { '3': {}, '4': {}, '5': {} },
    tokenList: [{ token: 'token3' }],
    expectedInput: ['3', '4', '5'],
  },
  {
    networkConfigurations: {},
    tokenList: [],
    expectedInput: [],
  },
];

describe('useTokenListPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  testCases.forEach(
    ({ networkConfigurations, tokenList, expectedInput }, index) => {
      it(`should handle test case ${index + 1}`, () => {
        // Set up mock return values for each test case
        mockedGetNetworkConfigurationsByChainId.mockReturnValue(
          networkConfigurations,
        );
        mockedGetTokenList.mockReturnValue(tokenList);

        // Mock implementation of useSelector to handle different selector returns
        (useSelector as jest.Mock).mockImplementation((selector) => {
          switch (selector) {
            case getNetworkConfigurationsByChainId:
              return networkConfigurations;
            case getTokenList:
              return tokenList;
            default:
              return null;
          }
        });

        // Render the hook
        const { result } = renderHook(() => useTokenListPolling());

        // Verify that useMultiPolling was called with expected arguments
        expect(mockedUseMultiPolling).toHaveBeenCalledWith({
          startPolling: tokenListStartPolling,
          stopPollingByPollingToken: tokenListStopPollingByPollingToken,
          input: expectedInput,
        });

        // Verify the returned tokenList
        expect(result.current.tokenList).toEqual(tokenList);
      });
    },
  );
});
