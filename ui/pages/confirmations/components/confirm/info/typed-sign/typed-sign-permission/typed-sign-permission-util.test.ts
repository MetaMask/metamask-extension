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
    it('returns translator literal for HOUR duration', () => {
      const t = jest.fn().mockReturnValue('HOURLY_TRANSLATION');
      const result = formatPeriodDuration(t, 3600);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationHourly');
      expect(result).toEqual('HOURLY_TRANSLATION');
    });

    it('returns translator literal for WEEK duration', () => {
      const t = jest.fn().mockReturnValue('WEEKLY_TRANSLATION');
      const result = formatPeriodDuration(t, 604800);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationWeekly');
      expect(result).toEqual('WEEKLY_TRANSLATION');
    });

    it('returns translator literal for DAY duration', () => {
      const t = jest.fn().mockReturnValue('DAILY_TRANSLATION');
      const result = formatPeriodDuration(t, 86400);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationDaily');
      expect(result).toEqual('DAILY_TRANSLATION');
    });

    it('returns translator literal for FORTNIGHT duration', () => {
      const t = jest.fn().mockReturnValue('BIWEEKLY_TRANSLATION');
      const result = formatPeriodDuration(t, 1209600);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationBiWeekly');
      expect(result).toEqual('BIWEEKLY_TRANSLATION');
    });

    it('formats multiple weeks correctly', () => {
      const t = jest.fn().mockReturnValue('SECONDS_TRANSLATION');
      const result = formatPeriodDuration(t, 1814400);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationSeconds');
      expect(result).toEqual('1814400 SECONDS_TRANSLATION');
    });

    it('returns translator literal for MONTH duration', () => {
      const t = jest.fn().mockReturnValue('MONTHLY_TRANSLATION');
      const result = formatPeriodDuration(t, 2592000);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationMonthly');
      expect(result).toEqual('MONTHLY_TRANSLATION');
    });

    it('returns translator literal for YEAR duration', () => {
      const t = jest.fn().mockReturnValue('YEARLY_TRANSLATION');
      const result = formatPeriodDuration(t, 31536000);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationYearly');
      expect(result).toEqual('YEARLY_TRANSLATION');
    });

    it('returns seconds as fallback for non-standard duration', () => {
      const t = jest.fn().mockReturnValue('SECONDS_TRANSLATION');
      const result = formatPeriodDuration(t, 45);
      expect(t).toHaveBeenCalledWith('confirmFieldPeriodDurationSeconds');
      expect(result).toEqual('45 SECONDS_TRANSLATION');
    });

    it('throws an error when period duration is 0 seconds', () => {
      const t = jest.fn();
      expect(() => formatPeriodDuration(t, 0)).toThrow(
        'Cannot format period duration of 0 seconds',
      );
    });

    it('throws an error when period duration is negative', () => {
      const t = jest.fn();
      expect(() => formatPeriodDuration(t, -1)).toThrow(
        'Cannot format negative period duration',
      );
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
