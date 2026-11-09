import React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  mockTextWidth,
  type TextWidthMock,
} from '../../../../../../test/lib/mock-text-width';
import configureStore from '../../../../../store/store';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { ConfirmInfoRowAddressDisplay } from './address-display';
import { TEST_ADDRESS } from './constants';

const defaultProps = {
  address: TEST_ADDRESS,
  chainId: '0x1',
  name: null as string | null,
  isAccount: false,
  image: undefined,
  displayState: TrustSignalDisplayState.Unknown,
};

const render = (props: Partial<typeof defaultProps> = {}) => {
  const store = configureStore({
    metamask: { ...mockState.metamask },
  });

  return renderWithProvider(
    <ConfirmInfoRowAddressDisplay {...defaultProps} {...props} />,
    store,
  );
};

describe('ConfirmInfoRowAddressDisplay', () => {
  it('renders display name element for unknown address', () => {
    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name')).toBeInTheDocument();
  });

  it('does not render trust icon when name is not provided', () => {
    const { container } = render({
      displayState: TrustSignalDisplayState.Unknown,
    });
    expect(container.querySelector('[data-testid="icon"]')).toBeNull();
  });

  it('renders trust icon when name is provided', () => {
    const { container } = render({
      name: 'Arbiscan: Donate',
      displayState: TrustSignalDisplayState.Verified,
    });
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders account name for known address', () => {
    const { getByTestId } = render({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Account 1',
      isAccount: true,
      displayState: TrustSignalDisplayState.Recognized,
    });
    expect(getByTestId('confirm-info-row-display-name')).toHaveTextContent(
      'Account 1',
    );
  });

  describe('unnamed address', () => {
    let textWidth: TextWidthMock;

    beforeEach(() => {
      textWidth = mockTextWidth();
    });

    afterEach(() => {
      textWidth.restore();
    });

    it('shows the full address when the row fits it', () => {
      textWidth.setRowWidth(500);

      const { getByTestId } = render();
      expect(getByTestId('confirm-info-row-display-name').textContent).toBe(
        TEST_ADDRESS,
      );
    });

    it('keeps the last 10 characters and shortens the start to fit', () => {
      textWidth.setRowWidth(250);

      const { getByTestId } = render();
      expect(getByTestId('confirm-info-row-display-name').textContent).toBe(
        '0x5CfE73b6021E…474086a7e1',
      );
    });

    it('shows more of the start in a wider row', () => {
      textWidth.setRowWidth(350);

      const { getByTestId } = render();
      expect(getByTestId('confirm-info-row-display-name').textContent).toBe(
        '0x5CfE73b6021E818B776b42…474086a7e1',
      );
    });

    it('left aligns the address inside its button', () => {
      textWidth.setRowWidth(500);

      const { getByText } = render();
      expect(getByText(TEST_ADDRESS)).toHaveClass('text-start');
    });
  });
});
