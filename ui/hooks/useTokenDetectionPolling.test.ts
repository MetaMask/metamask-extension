import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import {
  getAllDetectedTokensForSelectedAddress,
  getNetworkConfigurationsByChainId,
  getUseTokenDetection,
} from '../selectors';
import useTokenDetectionPolling from './useTokenDetectionPolling';
import useMultiPolling from './useMultiPolling';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getAllDetectedTokensForSelectedAddress: jest.fn(),
  getNetworkConfigurationsByChainId: jest.fn(),
  getUseTokenDetection: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  tokenDetectionStartPolling: jest.fn(),
  tokenDetectionStopPollingByPollingToken: jest.fn(),
}));

jest.mock('./useMultiPolling');

const mockedGetAllDetectedTokensForSelectedAddress =
  getAllDetectedTokensForSelectedAddress as jest.Mock;
const mockedGetNetworkConfigurationsByChainId =
  getNetworkConfigurationsByChainId as unknown as jest.Mock;
const mockedGetUseTokenDetection = getUseTokenDetection as jest.Mock;
const mockedUseMultiPolling = useMultiPolling as jest.Mock;

const testCases = [
  {
    useTokenDetection: true,
    networkConfigurations: { '1': {}, '2': {} },
    detectedTokens: [{ token: 'token1' }, { token: 'token2' }],
    expectedInput: [['1', '2']],
  },
  {
    useTokenDetection: false,
    networkConfigurations: { '1': {}, '2': {} },
    detectedTokens: [],
    expectedInput: [],
  },
  {
    useTokenDetection: true,
    networkConfigurations: {},
    detectedTokens: [],
    expectedInput: [[]],
  },
];

describe('useTokenDetectionPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  testCases.forEach(
    (
      {
        useTokenDetection,
        networkConfigurations,
        detectedTokens,
        expectedInput,
      },
      index,
    ) => {
      it(`should handle test case ${index + 1}`, () => {
        // Set up mock return values for each test case
        mockedGetUseTokenDetection.mockReturnValue(useTokenDetection);
        mockedGetNetworkConfigurationsByChainId.mockReturnValue(
          networkConfigurations,
        );
        mockedGetAllDetectedTokensForSelectedAddress.mockReturnValue(
          detectedTokens,
        );

        // Mock implementation of useSelector to handle different selector returns
        (useSelector as jest.Mock).mockImplementation((selector) => {
          switch (selector) {
            case getUseTokenDetection:
              return useTokenDetection;
            case getNetworkConfigurationsByChainId:
              return networkConfigurations;
            case getAllDetectedTokensForSelectedAddress:
              return detectedTokens;
            default:
              return null;
          }
        });

        // Render the hook
        const { result } = renderHook(() => useTokenDetectionPolling());

        // Verify that useMultiPolling was called with expected arguments
        expect(mockedUseMultiPolling).toHaveBeenCalledWith({
          startPolling: tokenDetectionStartPolling,
          stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
          input: expectedInput,
        });

        // Verify the returned detectedTokens
        expect(result.current.detectedTokens).toEqual(detectedTokens);
      });
    },
  );
});
