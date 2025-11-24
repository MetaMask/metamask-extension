import { useSelector } from 'react-redux';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors';
import { useIsBIP44 } from './useIsBIP44';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getIsMultichainAccountsState2Enabled: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockGetIsMultichainAccountsState2Enabled =
  getIsMultichainAccountsState2Enabled as jest.MockedFunction<
    typeof getIsMultichainAccountsState2Enabled
  >;

describe('useIsBIP44', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when multichain accounts state2 is enabled', () => {
    mockUseSelector.mockReturnValue(true);

    const result = useIsBIP44();

    expect(result).toBe(true);
    expect(mockUseSelector).toHaveBeenCalledWith(
      mockGetIsMultichainAccountsState2Enabled,
    );
  });

  it('returns false when multichain accounts state2 is disabled', () => {
    mockUseSelector.mockReturnValue(false);

    const result = useIsBIP44();

    expect(result).toBe(false);
    expect(mockUseSelector).toHaveBeenCalledWith(
      mockGetIsMultichainAccountsState2Enabled,
    );
  });
});
