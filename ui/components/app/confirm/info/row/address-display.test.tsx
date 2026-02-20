import React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import { useDisplayName } from '../../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { ConfirmInfoRowAddressDisplay } from './address-display';
import { TEST_ADDRESS } from './constants';

jest.mock('../../../../../pages/confirmations/context/confirm', () => ({
  useConfirmContext: () => ({
    currentConfirmation: { chainId: '0x1' },
  }),
}));

jest.mock('../../../../../hooks/useDisplayName');

const mockUseDisplayName = useDisplayName as jest.MockedFunction<
  typeof useDisplayName
>;

const render = (address: string = TEST_ADDRESS) => {
  const store = configureStore({
    metamask: { ...mockState.metamask },
  });

  return renderWithProvider(
    <ConfirmInfoRowAddressDisplay address={address} />,
    store,
  );
};

describe('ConfirmInfoRowAddressDisplay', () => {
  beforeEach(() => {
    mockUseDisplayName.mockReturnValue({
      name: null,
      hasPetname: false,
      isAccount: false,
      displayState: TrustSignalDisplayState.Unknown,
    });
  });

  it('renders display name element for unknown address', () => {
    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name')).toBeInTheDocument();
  });

  it('renders account name for known address', () => {
    mockUseDisplayName.mockReturnValue({
      name: 'Account 1',
      hasPetname: false,
      isAccount: true,
      displayState: TrustSignalDisplayState.Recognized,
    });

    const { getByTestId } = render(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
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
    mockUseDisplayName.mockReturnValue({
      name: 'Account 1',
      hasPetname: false,
      isAccount: true,
      displayState: TrustSignalDisplayState.Recognized,
    });

    const { getByTestId } = render(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
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
