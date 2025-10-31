import { renderHook } from '@testing-library/react-hooks';
import { addHexPrefix, padToEven } from 'ethereumjs-util';
import { Hex } from '@metamask/utils';

import { getCode } from '../../../../../store/actions';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { useContractCode } from './useContractCode';

jest.mock('ethereumjs-util');
jest.mock('../../../../../store/actions');
jest.mock('../../../../../hooks/useAsync');

describe('useContractCode', () => {
  const mockGetCode = jest.mocked(getCode);
  const mockUseAsyncResult = jest.mocked(useAsyncResult);
  const mockAddHexPrefix = jest.mocked(addHexPrefix);
  const mockPadToEven = jest.mocked(padToEven);

  const mockAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockNetworkClientId = 'test-network';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAsyncResult.mockReturnValue({
      value: null,
      error: undefined,
      status: 'success',
      pending: false,
      idle: false,
    });
    mockAddHexPrefix.mockImplementation((value) => `0x${value}`);
    mockPadToEven.mockImplementation((value) => value);
  });

  it('returns null values when address is missing', async () => {
    renderHook(() => useContractCode('' as Hex, mockNetworkClientId));

    const getCodeAsyncCallback = mockUseAsyncResult.mock.calls[0][0];
    const asyncResult = await getCodeAsyncCallback();

    expect(asyncResult).toEqual({
      contractCode: null,
      isContractAddress: null,
    });
    expect(mockGetCode).not.toHaveBeenCalled();
  });

  it('returns null values when networkClientId is missing', async () => {
    renderHook(() => useContractCode(mockAddress, ''));

    const getCodeAsyncCallback = mockUseAsyncResult.mock.calls[0][0];
    const asyncResult = await getCodeAsyncCallback();

    expect(asyncResult).toEqual({
      contractCode: null,
      isContractAddress: null,
    });
    expect(mockGetCode).not.toHaveBeenCalled();
  });

  it('returns contract code and true for contract address when valid code exists', async () => {
    const mockRawCode = '0x608060405234801561001057600080fd5b50';
    const mockProcessedCode = '0x608060405234801561001057600080fd5b50';

    mockGetCode.mockResolvedValue(mockRawCode);
    mockPadToEven.mockReturnValue('608060405234801561001057600080fd5b50');
    mockAddHexPrefix.mockReturnValue(mockProcessedCode);

    renderHook(() => useContractCode(mockAddress, mockNetworkClientId));

    const getCodeAsyncCallback = mockUseAsyncResult.mock.calls[0][0];
    const asyncResult = await getCodeAsyncCallback();

    expect(mockGetCode).toHaveBeenCalledWith(mockAddress, mockNetworkClientId);
    expect(mockPadToEven).toHaveBeenCalledWith(
      '608060405234801561001057600080fd5b50',
    );
    expect(mockAddHexPrefix).toHaveBeenCalledWith(
      '608060405234801561001057600080fd5b50',
    );
    expect(asyncResult).toEqual({
      contractCode: mockProcessedCode,
      isContractAddress: true,
    });
  });

  it('returns contract code and false for EOA when code is 0x', async () => {
    const mockRawCode = '0x';
    const mockProcessedCode = '0x';

    mockGetCode.mockResolvedValue(mockRawCode);
    mockPadToEven.mockReturnValue('');
    mockAddHexPrefix.mockReturnValue(mockProcessedCode);

    renderHook(() => useContractCode(mockAddress, mockNetworkClientId));

    const getCodeAsyncCallback = mockUseAsyncResult.mock.calls[0][0];
    const asyncResult = await getCodeAsyncCallback();

    expect(asyncResult).toEqual({
      contractCode: mockProcessedCode,
      isContractAddress: false,
    });
  });

  it('returns contract code and false for EOA when code is 0x0', async () => {
    const mockRawCode = '0x0';
    const mockProcessedCode = '0x0';

    mockGetCode.mockResolvedValue(mockRawCode);
    mockPadToEven.mockReturnValue('0');
    mockAddHexPrefix.mockReturnValue(mockProcessedCode);

    renderHook(() => useContractCode(mockAddress, mockNetworkClientId));

    const getCodeAsyncCallback = mockUseAsyncResult.mock.calls[0][0];
    const asyncResult = await getCodeAsyncCallback();

    expect(asyncResult).toEqual({
      contractCode: mockProcessedCode,
      isContractAddress: false,
    });
  });

  it('returns null values when getCode throws an error', async () => {
    mockGetCode.mockRejectedValue(new Error('Network error'));

    renderHook(() => useContractCode(mockAddress, mockNetworkClientId));

    const getCodeAsyncCallback = mockUseAsyncResult.mock.calls[0][0];
    const asyncResult = await getCodeAsyncCallback();

    expect(mockGetCode).toHaveBeenCalledWith(mockAddress, mockNetworkClientId);
    expect(asyncResult).toEqual({
      contractCode: null,
      isContractAddress: false,
    });
  });

  it('calls useAsyncResult with correct parameters', () => {
    renderHook(() => useContractCode(mockAddress, mockNetworkClientId));

    expect(mockUseAsyncResult).toHaveBeenCalledWith(expect.any(Function), [
      mockAddress,
      mockNetworkClientId,
    ]);
  });

  it('processes raw code correctly by slicing, padding, and adding hex prefix', async () => {
    const mockRawCode = '0x1234abcd';
    mockGetCode.mockResolvedValue(mockRawCode);
    mockPadToEven.mockReturnValue('1234abcd');
    mockAddHexPrefix.mockReturnValue('0x1234abcd');

    renderHook(() => useContractCode(mockAddress, mockNetworkClientId));

    const getCodeAsyncCallback = mockUseAsyncResult.mock.calls[0][0];
    await getCodeAsyncCallback();

    expect(mockPadToEven).toHaveBeenCalledWith('1234abcd');
    expect(mockAddHexPrefix).toHaveBeenCalledWith('1234abcd');
  });
});
