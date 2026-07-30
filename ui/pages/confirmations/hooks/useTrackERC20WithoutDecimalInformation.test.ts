import { renderHook } from '@testing-library/react-hooks';

import { CHAIN_IDS } from '@metamask/transaction-controller';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { TokenDetailsERC20 } from '../utils/token';
import useTrackERC20WithoutDecimalInformation from './useTrackERC20WithoutDecimalInformation';

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => 0x1,
}));

describe('useTrackERC20WithoutDecimalInformation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should invoke trackEvent method only once per instance of the hook', () => {
    renderHook(() =>
      useTrackERC20WithoutDecimalInformation(CHAIN_IDS.MAINNET, '0x5', {
        standard: TokenStandard.ERC20,
      } as TokenDetailsERC20),
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });
});
