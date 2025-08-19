import { renderHook } from '@testing-library/react-hooks';
import { useContext } from 'react';

import { CHAIN_IDS } from '@metamask/transaction-controller';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { TokenDetailsERC20 } from '../utils/token';
import useTrackERC20WithoutDecimalInformation from './useTrackERC20WithoutDecimalInformation';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => 0x1,
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('useTrackERC20WithoutDecimalInformation', () => {
  const useContextMock = jest.mocked(useContext);

  const trackEventMock = jest.fn();

  it('should invoke trackEvent method only once per instance of the hook', () => {
    useContextMock.mockImplementation((context) => {
      if (context === MetaMetricsContext) {
        return { trackEvent: trackEventMock };
      }
      return undefined;
    });

    renderHook(() =>
      useTrackERC20WithoutDecimalInformation(CHAIN_IDS.MAINNET, '0x5', {
        standard: TokenStandard.ERC20,
      } as TokenDetailsERC20),
    );

    expect(trackEventMock).toHaveBeenCalledTimes(1);
  });
});
