import React from 'react';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { shortenAddress } from '../../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';
import { useDispatch } from '../../../../store/hooks';
import NameDisplay from './name-display';

jest.mock('../../../../store/hooks', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
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

  describe('when truncateStart is set', () => {
    const address = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

    it('renders the full checksum address on one line', () => {
      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        displayState: TrustSignalDisplayState.Unknown,
        isAccount: false,
      });
      const { getByText } = renderWithProvider(
        <NameDisplay
          value={address}
          type={NameType.ETHEREUM_ADDRESS}
          variation={'0x5'}
          truncateStart
        />,
      );

      const text = getByText(toChecksumHexAddress(address));
      expect(text).toHaveAttribute('dir', 'ltr');
      expect(text.parentElement).toHaveClass('ellipsis-start');
    });

    it('renders the full name instead of a shortened one', () => {
      useDisplayNameMock.mockReturnValue({
        name: 'Uniswap V3: Router 2',
        hasPetname: false,
        displayState: TrustSignalDisplayState.Recognized,
        isAccount: false,
      });
      const { getByText, queryByText } = renderWithProvider(
        <NameDisplay
          value={address}
          type={NameType.ETHEREUM_ADDRESS}
          variation={'0x5'}
          truncateStart
        />,
      );

      expect(getByText('Uniswap V3: Router 2').parentElement).toHaveClass(
        'ellipsis-start',
      );
      expect(queryByText(toChecksumHexAddress(address))).toBeNull();
    });
  });
});
