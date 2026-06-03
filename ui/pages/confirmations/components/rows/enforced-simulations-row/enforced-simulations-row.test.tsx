import React from 'react';
import { act, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { TransactionContainerType } from '@metamask/transaction-controller';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { applyTransactionContainersExisting } from '../../../../../store/actions';
import { useIsEnforcedSimulationsEligible } from '../../../hooks/useIsEnforcedSimulationsEligible';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { EnforcedSimulationsRow } from './enforced-simulations-row';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  applyTransactionContainersExisting: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../hooks/useIsEnforcedSimulationsEligible');

const mockStore = configureMockStore([]);

const useIsEnforcedSimulationsEligibleMock = jest.mocked(
  useIsEnforcedSimulationsEligible,
);
const useI18nContextMock = jest.mocked(useI18nContext);

function render({
  isEligible = true,
  containerTypes,
  origin,
  delegationAddress,
}: {
  isEligible?: boolean;
  containerTypes?: TransactionContainerType[];
  origin?: string;
  delegationAddress?: string;
} = {}) {
  useIsEnforcedSimulationsEligibleMock.mockReturnValue(isEligible);

  useI18nContextMock.mockReturnValue(((key: string) => {
    const translations: Record<string, string> = {
      addedProtectionOptionalBadge:
        messages.addedProtectionOptionalBadge.message,
      addedProtectionTitle: messages.addedProtectionTitle.message,
      addedProtectionDescription: messages.addedProtectionDescription.message,
      addedProtectionTooltip:
        "If the final transaction doesn't match this preview, it won't go through. You only pay the network fee.",
      learnMore: 'Learn more',
    };
    return translations[key] ?? key;
  }) as ReturnType<typeof useI18nContext>);

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

  it('renders nothing when enforced simulations is not eligible', async () => {
    const { container } = render({ isEligible: false });

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders the component when enforced simulations is supported', async () => {
    const { getByTestId } = render();

    await waitFor(() => {
      expect(getByTestId('enforced-simulations-row')).toBeInTheDocument();
    });
  });

  it('renders the optional badge', async () => {
    const { getByTestId, getByText } = render();

    await waitFor(() => {
      expect(
        getByTestId('enforced-simulations-optional-badge'),
      ).toBeInTheDocument();
    });

    expect(
      getByText(messages.addedProtectionOptionalBadge.message),
    ).toBeInTheDocument();
  });

  it('renders the title and description', async () => {
    const { getByText } = render();

    await waitFor(() => {
      expect(
        getByText(messages.addedProtectionTitle.message),
      ).toBeInTheDocument();
    });

    expect(
      getByText(messages.addedProtectionDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the learn more link', async () => {
    const { getByTestId } = render();

    await waitFor(() => {
      expect(
        getByTestId('enforced-simulations-learn-more'),
      ).toBeInTheDocument();
    });
  });

  it('renders the checkbox as checked when enabled', async () => {
    const { getByTestId } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    await waitFor(() => {
      const input = getByTestId(
        'enforced-simulations-toggle-input',
      ) as HTMLInputElement;
      expect(input).toBeChecked();
    });
  });

  it('renders the checkbox as unchecked when disabled', async () => {
    const { getByTestId } = render({ containerTypes: [] });

    await waitFor(() => {
      const input = getByTestId(
        'enforced-simulations-toggle-input',
      ) as HTMLInputElement;
      expect(input).not.toBeChecked();
    });
  });

  it('calls toggle actions when checkbox is clicked', async () => {
    const { getByTestId } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    await waitFor(() => {
      expect(
        getByTestId('enforced-simulations-toggle-input'),
      ).toBeInTheDocument();
    });

    const input = getByTestId(
      'enforced-simulations-toggle-input',
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

    await waitFor(() => {
      expect(
        getByTestId('enforced-simulations-toggle-input'),
      ).toBeInTheDocument();
    });

    const input = getByTestId(
      'enforced-simulations-toggle-input',
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

  it('shows description text', async () => {
    const { getByText } = render({
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    await waitFor(() => {
      expect(
        getByText(
          "You're interacting with an unknown address. This helps prevent malicious transactions.",
        ),
      ).toBeInTheDocument();
    });
  });
});
