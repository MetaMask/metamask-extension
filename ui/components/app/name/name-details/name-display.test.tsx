import React from 'react';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  mockTextWidth,
  type TextWidthMock,
} from '../../../../../test/lib/mock-text-width';
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

  describe('with fillWidth', () => {
    const ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
    let textWidth: TextWidthMock;

    const renderFilled = (
      displayName: Partial<ReturnType<typeof useDisplayName>>,
      value = ADDRESS,
    ) => {
      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        displayState: TrustSignalDisplayState.Unknown,
        isAccount: false,
        ...displayName,
      });
      return renderWithProvider(
        <NameDisplay
          value={value}
          type={NameType.ETHEREUM_ADDRESS}
          variation={'0x1'}
          fillWidth
        />,
      );
    };

    beforeEach(() => {
      textWidth = mockTextWidth();
    });

    afterEach(() => {
      textWidth.restore();
    });

    it('shows the address instead of a security label for an unknown address', () => {
      textWidth.setRowWidth(500);
      const spender = '0x1111111111111111111111111111111111111111';
      const { container, queryByText } = renderFilled(
        { name: 'Null: 0x111...111' },
        spender,
      );

      expect(container.querySelector('.name__value')?.textContent).toBe(
        spender,
      );
      expect(queryByText('Null: 0x111...111')).toBeNull();
    });

    it('keeps the last 10 characters of an address and shortens the start', () => {
      textWidth.setRowWidth(250);
      const { container } = renderFilled({});

      expect(container.querySelector('.name__value')?.textContent).toBe(
        '0x5CfE73b6021E…474086a7e1',
      );
    });

    it('shows more of the address in a wider row', () => {
      textWidth.setRowWidth(350);
      const { container } = renderFilled({});

      expect(container.querySelector('.name__value')?.textContent).toBe(
        '0x5CfE73b6021E818B776b42…474086a7e1',
      );
    });

    it('shows a long name in full when it fits', () => {
      textWidth.setRowWidth(500);
      const { container } = renderFilled({
        name: 'Malicious address',
        displayState: TrustSignalDisplayState.Malicious,
      });

      expect(container.querySelector('.name__name')?.textContent).toBe(
        'Malicious address',
      );
    });

    it('keeps the end of a long name and shortens the start', () => {
      textWidth.setRowWidth(100);
      const { container } = renderFilled({
        name: 'Malicious address',
        displayState: TrustSignalDisplayState.Malicious,
      });

      expect(container.querySelector('.name__name')?.textContent).toBe(
        '…s address',
      );
    });

    it('shows a short name in full', () => {
      textWidth.setRowWidth(250);
      const { container } = renderFilled({
        name: 'USDC',
        displayState: TrustSignalDisplayState.Recognized,
      });

      expect(container.querySelector('.name__name')?.textContent).toBe('USDC');
    });
  });
});
