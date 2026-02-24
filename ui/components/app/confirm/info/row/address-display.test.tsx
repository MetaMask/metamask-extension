import React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
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

  it('renders with clickable class for non-account address', () => {
    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name')).toHaveClass(
      'confirm-info-row-address-display__clickable',
    );
  });

  it('does not render clickable class for account address', () => {
    const { getByTestId } = render({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Account 1',
      isAccount: true,
      displayState: TrustSignalDisplayState.Recognized,
    });
    expect(getByTestId('confirm-info-row-display-name')).not.toHaveClass(
      'confirm-info-row-address-display__clickable',
    );
  });

  it('renders full address when container has sufficient width', () => {
    jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(500);

    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name').textContent).toContain(
      '0x5CfE73b6',
    );

    jest.restoreAllMocks();
  });
});
