import React from 'react';
import { NameType } from '@metamask/name-controller';
import { useDispatch, useSelector } from 'react-redux';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { shortenAddress } from '../../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
import NameDisplay from './name-display';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../hooks/useDisplayName', () => ({
  useDisplayName: jest.fn(),
}));

describe('NameDisplay', () => {
  const useDispatchMock = jest.mocked(useDispatch);
  const useSelectorMock = jest.mocked(useSelector);
  const useDisplayNameMock = jest.mocked(useDisplayName);

  beforeEach(() => {
    jest.resetAllMocks();
    useDispatchMock.mockReturnValue(jest.fn());
    useSelectorMock.mockReturnValue(jest.fn());
  });

  it('should render', () => {
    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
      isAccount: false,
    });
    const { getByText } = renderWithProvider(
      <NameDisplay
        value={'0xdeadbeef'}
        type={NameType.ETHEREUM_ADDRESS}
        variation={'0x5'}
      />,
    );
    expect(
      getByText(shortenAddress(toChecksumHexAddress('0xdeadbeef'))),
    ).toBeInTheDocument();
  });

  it('should render name from useDisplayName if available', () => {
    useDisplayNameMock.mockReturnValue({
      name: 'DisplayName',
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
      isAccount: false,
    });
    const { getByText } = renderWithProvider(
      <NameDisplay
        value={'0xdeadbeef'}
        type={NameType.ETHEREUM_ADDRESS}
        variation={'0x5'}
      />,
    );
    expect(getByText('DisplayName')).toBeInTheDocument();
  });

  it('should render fallback name if name is not available', () => {
    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
      isAccount: false,
    });
    const { getByText } = renderWithProvider(
      <NameDisplay
        value={'0xdeadbeef'}
        type={NameType.ETHEREUM_ADDRESS}
        variation={'0x5'}
        fallbackName={'TEST'}
      />,
    );
    expect(getByText('TEST')).toBeInTheDocument();
  });
});
