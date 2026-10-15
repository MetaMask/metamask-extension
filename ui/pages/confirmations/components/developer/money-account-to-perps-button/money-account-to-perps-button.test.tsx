import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { usePerpsDepositConfirmation } from '../../../../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { useMoneyAccountInfo } from '../../../../../hooks/money/useMoneyAccountInfo';
import { PayWithOption } from '../../../hooks/useConfirmationNavigation';
import { MoneyAccountToPerpsButton } from './money-account-to-perps-button';

const render = () =>
  renderWithProvider(
    <MoneyAccountToPerpsButton />,
    configureMockStore()(mockState),
  );

jest.mock(
  '../../../../../components/app/perps/hooks/usePerpsDepositConfirmation',
  () => ({
    usePerpsDepositConfirmation: jest.fn(),
  }),
);

jest.mock('../../../../../hooks/money/useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

const usePerpsDepositConfirmationMock = jest.mocked(
  usePerpsDepositConfirmation,
);
const useMoneyAccountInfoMock = jest.mocked(useMoneyAccountInfo);

describe('MoneyAccountToPerpsButton', () => {
  const triggerMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    triggerMock.mockResolvedValue({ transactionId: 'tx-1' });
    usePerpsDepositConfirmationMock.mockReturnValue({
      trigger: triggerMock,
      isLoading: false,
    });
    useMoneyAccountInfoMock.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: '0xd5fe' },
    } as unknown as ReturnType<typeof useMoneyAccountInfo>);
  });

  it('configures the perps deposit confirmation with the money account pay option', () => {
    render();

    expect(usePerpsDepositConfirmationMock).toHaveBeenCalledWith({
      payWithOption: PayWithOption.MoneyAccount,
    });
  });

  it('initiates the perps deposit on click', () => {
    render();

    const button = screen.getByRole('button', {
      name: 'Send from Money Account to Perps',
    });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(triggerMock).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when the money account is unavailable', () => {
    useMoneyAccountInfoMock.mockReturnValue({
      isMoneyAccountFeatureEnabled: false,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    } as unknown as ReturnType<typeof useMoneyAccountInfo>);

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('disables the button while initiating', () => {
    usePerpsDepositConfirmationMock.mockReturnValue({
      trigger: triggerMock,
      isLoading: true,
    });

    render();

    expect(
      screen.getByRole('button', {
        name: 'Send from Money Account to Perps',
      }),
    ).toBeDisabled();
  });
});
