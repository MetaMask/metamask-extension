import React from 'react';
import { act } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { TransactionContainerType } from '@metamask/transaction-controller';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useIsEnforcedSimulationsSupported } from '../../../hooks/transactions/useIsEnforcedSimulationsSupported';
import { applyTransactionContainersExisting } from '../../../../../store/actions';
import { useFeeCalculations } from '../../confirm/info/hooks/useFeeCalculations';
import * as messages from '../../../../../../app/_locales/en/messages.json';
import { EnforcedSimulationsRow } from './enforced-simulations-row';

jest.mock('../../../hooks/transactions/useIsEnforcedSimulationsSupported');
jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  applyTransactionContainersExisting: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../confirm/info/hooks/useFeeCalculations', () => ({
  useFeeCalculations: jest.fn(),
}));

const mockStore = configureMockStore([]);

const useIsEnforcedSimulationsSupportedMock = jest.mocked(
  useIsEnforcedSimulationsSupported,
);
const useI18nContextMock = jest.mocked(useI18nContext);
const useFeeCalculationsMock = jest.mocked(useFeeCalculations);

function render({
  isSupported = true,
  containerTypes,
  containerTypeDiffFiat = '',
  origin,
  delegationAddress,
}: {
  isSupported?: boolean;
  containerTypes?: TransactionContainerType[];
  containerTypeDiffFiat?: string;
  origin?: string;
  delegationAddress?: string;
} = {}) {
  useIsEnforcedSimulationsSupportedMock.mockReturnValue(isSupported);

  useI18nContextMock.mockReturnValue(((key: string, args?: string[]) => {
    const translations: Record<string, string> = {
      addedProtectionOptionalBadge: messages.addedProtectionOptionalBadge.message,
      addedProtectionTitle: messages.addedProtectionTitle.message,
      addedProtectionDescription: messages.addedProtectionDescription.message,
      addedProtectionFeeDescription: `Add ${args?.[0] ?? ''} in network fees to lock in your expected balance changes.`,
      learnMore: 'Learn more',
    };
    return translations[key] ?? key;
  }) as ReturnType<typeof useI18nContext>);

  useFeeCalculationsMock.mockReturnValue({
    containerTypeDiffFiat,
  } as unknown as ReturnType<typeof useFeeCalculations>);

  const transaction = genUnapprovedContractInteractionConfirmation({
    containerTypes,
    origin: origin ?? 'https://some-dapp.com',
    delegationAddress: delegationAddress as `0x${string}`,
  });

  const state = getMockConfirmStateForTransaction(transaction, {
    metamask: {},
  });

  return renderWithConfirmContextProvider(
    <EnforcedSimulationsRow />,
    mockStore(state),
  );
}

describe('EnforcedSimulationsRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when enforced simulations is not supported', () => {
    const { container } = render({ isSupported: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the component when enforced simulations is supported', () => {
    const { getByTestId } = render();
    expect(getByTestId('enforced-simulations-row')).toBeInTheDocument();
  });

  it('renders the optional badge', () => {
    const { getByTestId, getByText } = render();

    expect(
      getByTestId('enforced-simulations-optional-badge'),
    ).toBeInTheDocument();
    expect(getByText(messages.addedProtectionOptionalBadge.message)).toBeInTheDocument();
  });

  it('renders the title and description', () => {
    const { getByText } = render();

    expect(getByText(messages.addedProtectionTitle.message)).toBeInTheDocument();
    expect(
      getByText(messages.addedProtectionDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the learn more link', () => {
    const { getByTestId } = render();
    expect(getByTestId('enforced-simulations-learn-more')).toBeInTheDocument();
  });

  it('renders the checkbox as checked when enabled', () => {
    const { getByTestId } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    const toggle = getByTestId('enforced-simulations-toggle');
    const input = toggle.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(input).toBeChecked();
  });

  it('renders the checkbox as unchecked when disabled', () => {
    const { getByTestId } = render({ containerTypes: [] });

    const toggle = getByTestId('enforced-simulations-toggle');
    const input = toggle.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(input).not.toBeChecked();
  });

  it('calls toggle actions when checkbox is clicked', async () => {
    const { getByTestId } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    const toggle = getByTestId('enforced-simulations-toggle');
    const input = toggle.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    input?.click();

    expect(applyTransactionContainersExisting).toHaveBeenCalledWith(
      expect.any(String),
      [],
    );
  });

  it('shows a loading spinner while the container types are updating', async () => {
    const { getByTestId, queryByTestId } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    const toggle = getByTestId('enforced-simulations-toggle');
    const input = toggle.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      input?.click();
    });

    expect(getByTestId('enforced-simulations-loading')).toBeInTheDocument();
    expect(
      queryByTestId('enforced-simulations-toggle'),
    ).not.toBeInTheDocument();
  });

  it('shows fee description when enabled and fee delta is available', () => {
    const { getByText } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
      containerTypeDiffFiat: '$6.21',
    });

    expect(
      getByText(
        'Add $6.21 in network fees to lock in your expected balance changes.',
      ),
    ).toBeInTheDocument();
  });

  it('shows default description when enabled but no fee delta', () => {
    const { getByText } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    expect(
      getByText(
        "You're interacting with an unknown address. This helps prevent malicious transactions.",
      ),
    ).toBeInTheDocument();
  });
});
