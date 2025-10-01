import { useSelector } from 'react-redux';
import {
  formatPeriodDuration,
  useErc20TokenDetails,
  useNativeTokenLabel,
} from './typed-sign-permission-util';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('typed-sign-permission-util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatPeriodDuration', () => {
    it('returns "Every week" for WEEK duration', () => {
      const result = formatPeriodDuration(604800);
      expect(result).toEqual('Every week');
    });

    it('returns "Every day" for DAY duration', () => {
      const result = formatPeriodDuration(86400);
      expect(result).toEqual('Every day');
    });

    it('formats multiple weeks correctly', () => {
      const result = formatPeriodDuration(1209600);
      expect(result).toEqual('Every 2 weeks');
    });

    it('formats weeks and days correctly', () => {
      const result = formatPeriodDuration(950400);
      expect(result).toEqual('Every 1 week and 4 days');
    });

    it('formats weeks, days, and hours correctly', () => {
      const result = formatPeriodDuration(954000);
      expect(result).toEqual('Every 1 week, 4 days and 1 hour');
    });

    it('formats weeks, days, hours, and minutes correctly', () => {
      const result = formatPeriodDuration(954060);
      expect(result).toEqual('Every 1 week, 4 days, 1 hour and 1 minute');
    });

    it('formats weeks, days, hours, minutes, and seconds correctly', () => {
      const result = formatPeriodDuration(954061);
      expect(result).toEqual(
        'Every 1 week, 4 days, 1 hour, 1 minute and 1 second',
      );
    });

    it('formats only hours correctly', () => {
      const result = formatPeriodDuration(7200);
      expect(result).toEqual('Every 2 hours');
    });

    it('formats only minutes correctly', () => {
      const result = formatPeriodDuration(120);
      expect(result).toEqual('Every 2 minutes');
    });

    it('formats only seconds correctly', () => {
      const result = formatPeriodDuration(30);
      expect(result).toEqual('Every 30 seconds');
    });

    it('handles single units correctly', () => {
      expect(formatPeriodDuration(3600)).toEqual('Every hour');
      expect(formatPeriodDuration(60)).toEqual('Every minute');
      expect(formatPeriodDuration(1)).toEqual('Every second');
    });

    it('throws an error when period duration is 0 seconds', () => {
      expect(() => formatPeriodDuration(0)).toThrow(
        'Cannot format period duration of 0 seconds',
      );
    });

    it('handles fractional seconds by flooring', () => {
      const result = formatPeriodDuration(1.5);
      expect(result).toEqual('Every 1 second');
    });

    it('handles complex combinations', () => {
      const result = formatPeriodDuration(1234567);
      expect(result).toEqual(
        'Every 2 weeks, 6 hours, 56 minutes and 7 seconds',
      );
    });

    it('handles very large durations', () => {
      const result = formatPeriodDuration(31536000);
      expect(result).toEqual('Every 52 weeks and 1 day');
    });
  });

  describe('useErc20TokenDetails', () => {
    const mockToken = {
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
    };

    const mockTokenWithSymbolOnly = {
      symbol: 'SYMBOL',
      decimals: 6,
    };

    const mockTokenWithNameOnly = {
      name: 'Name Only Token',
      decimals: 8,
    };

    beforeEach(() => {
      mockUseSelector.mockImplementation(() => mockToken);
    });

    it('returns token details with name and decimals', () => {
      const result = useErc20TokenDetails({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        chainId: '0x1',
      });

      expect(result).toEqual({
        label: 'Test Token',
        decimals: 18,
      });
    });

    it('returns symbol when name is not available', () => {
      mockUseSelector.mockImplementation(() => mockTokenWithSymbolOnly);

      const result = useErc20TokenDetails({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        chainId: '0x1',
      });

      expect(result).toEqual({
        label: 'SYMBOL',
        decimals: 6,
      });
    });

    it('returns name when symbol is not available', () => {
      mockUseSelector.mockImplementation(() => mockTokenWithNameOnly);

      const result = useErc20TokenDetails({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        chainId: '0x1',
      });

      expect(result).toEqual({
        label: 'Name Only Token',
        decimals: 8,
      });
    });

    it('returns undefined values when token is not found', () => {
      mockUseSelector.mockImplementation(() => undefined);

      const result = useErc20TokenDetails({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        chainId: '0x1',
      });

      expect(result).toEqual({
        label: undefined,
        decimals: undefined,
      });
    });

    it('calls selector with correct parameters', () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890';
      const chainId = '0x1';

      useErc20TokenDetails({ tokenAddress, chainId });

      expect(mockUseSelector).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('useNativeTokenLabel', () => {
    const mockNetworkConfig = {
      nativeCurrency: 'ETH',
    };

    beforeEach(() => {
      mockUseSelector.mockImplementation(() => mockNetworkConfig);
    });

    it('returns native currency symbol when available', () => {
      const result = useNativeTokenLabel('0x1');

      expect(result).toEqual('ETH');
    });

    it('returns "NATIVE" when network config is not found', () => {
      mockUseSelector.mockImplementation(() => undefined);

      const result = useNativeTokenLabel('0x999');

      expect(result).toEqual('NATIVE');
    });

    it('calls selector with correct parameters', () => {
      const chainId = '0x1';

      useNativeTokenLabel(chainId);

      expect(mockUseSelector).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
