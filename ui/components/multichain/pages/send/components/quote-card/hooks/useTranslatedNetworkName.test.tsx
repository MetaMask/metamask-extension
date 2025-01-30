import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getCurrentChainId } from '../../../../../../../../shared/modules/selectors/networks';
import useTranslatedNetworkName from './useTranslatedNetworkName';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

describe('useTranslatedNetworkName', () => {
  let currentChainId: string = CHAIN_IDS.MAINNET;

  const translationMock = jest.fn((key) => key);

  beforeEach(() => {
    currentChainId = CHAIN_IDS.MAINNET;
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getCurrentChainId) {
        return currentChainId;
      }
      return undefined;
    });

    (useI18nContext as jest.Mock).mockReturnValue(translationMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return translated network name for MAINNET', () => {
    currentChainId = CHAIN_IDS.MAINNET;

    const { result } = renderHook(() => useTranslatedNetworkName());

    expect(translationMock).toBeCalledTimes(1);
    expect(result.current).toBe('networkNameEthereum');
  });

  it('should return undefined for unknown chain ID', () => {
    currentChainId = '0xBAD';

    const { result } = renderHook(() => useTranslatedNetworkName());

    expect(translationMock).toBeCalledTimes(0);
    expect(result.current).toBeUndefined();
  });
});
