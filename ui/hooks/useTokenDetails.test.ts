import { renderHook, act } from '@testing-library/react-hooks';
import { getTokenStandardAndDetails } from '../store/actions';
import { useTokenDetails } from './useTokenDetails';
import { waitFor } from '@testing-library/react';

jest.mock('../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
}));

const mockGetTokenStandardAndDetails = getTokenStandardAndDetails as jest.Mock;

describe('useTokenDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch token details and update state correctly', async () => {
    const tokenAddresses = ['address1', 'address2'];
    const tokenDetails = [
      { standard: 'ERC20', name: 'Token 1' },
      { standard: 'ERC721', name: 'Token 2' },
    ];

    mockGetTokenStandardAndDetails
      .mockResolvedValueOnce(tokenDetails[0])
      .mockResolvedValueOnce(tokenDetails[1]);

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenDetails(tokenAddresses),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.addressToTokenDetails).toEqual({});

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.addressToTokenDetails).toEqual({
      address1: tokenDetails[0],
      address2: tokenDetails[1],
    });

    expect(mockGetTokenStandardAndDetails).toHaveBeenCalledTimes(2);
    expect(mockGetTokenStandardAndDetails).toHaveBeenCalledWith('address1');
    expect(mockGetTokenStandardAndDetails).toHaveBeenCalledWith('address2');
  });

  it('should update token details when token addresses change', async () => {
    const initialAddresses = ['address1', 'address2'];
    const updatedAddresses = ['address3', 'address4'];
    const initialTokenDetails = [
      { standard: 'ERC20', name: 'Token 1' },
      { standard: 'ERC721', name: 'Token 2' },
    ];
    const updatedTokenDetails = [
      { standard: 'ERC1155', name: 'Token 3' },
      { standard: 'ERC20', name: 'Token 4' },
    ];

    mockGetTokenStandardAndDetails
      .mockResolvedValueOnce(initialTokenDetails[0])
      .mockResolvedValueOnce(initialTokenDetails[1])
      .mockResolvedValueOnce(updatedTokenDetails[0])
      .mockResolvedValueOnce(updatedTokenDetails[1]);

    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ tokenAddresses }) => useTokenDetails(tokenAddresses),
      { initialProps: { tokenAddresses: initialAddresses } },
    );

    await waitForNextUpdate();

    expect(result.current.addressToTokenDetails).toEqual({
      address1: initialTokenDetails[0],
      address2: initialTokenDetails[1],
    });

    rerender({ tokenAddresses: updatedAddresses });

    await waitForNextUpdate();

    expect(result.current.addressToTokenDetails).toEqual({
      address3: updatedTokenDetails[0],
      address4: updatedTokenDetails[1],
    });
  });

  it.only('should set isLoading to false when tokenAddresses is empty', async () => {
    const { result } = renderHook(() => useTokenDetails([]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetTokenStandardAndDetails).not.toHaveBeenCalled();
  });
});
