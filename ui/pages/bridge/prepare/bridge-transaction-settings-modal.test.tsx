import React from 'react';
import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { fireEvent } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import * as bridgeSelectors from '../../../ducks/bridge/selectors';
import CrossChainSwap from '..';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { waitForElementById } from '../../../../test/integration/helpers';
import { setSlippage } from '../../../ducks/bridge/actions';

const TX_MODAL = {
  refElement: 'bridge__header-settings-button',
  submitButton: 'bridge__tx-settings-modal-submit-button',
  customButton: 'bridge__tx-settings-modal-custom-button',
  customInput: 'bridge__tx-settings-modal-custom-input',
  closeButton: 'bridge__tx-settings-modal-close-button',
};

const renderModal = (initialSlippage?: number) => {
  const mockStore = createBridgeMockStore();
  const store = configureStore(mockStore);
  const renderResult = renderWithProvider(
    <CrossChainSwap />,
    store,
    CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
  );
  store.dispatch(setSlippage(initialSlippage));
  return { ...renderResult, store };
};

const openModal = async (getByTestId: (id: string) => HTMLElement) => {
  await act(async () => {
    fireEvent.click(getByTestId(TX_MODAL.refElement));
    await waitForElementById(TX_MODAL.submitButton);
  });
};

const interactWithCustomInput = async (
  getByTestId: (id: string) => HTMLElement,
  action?: (input: HTMLElement) => void | Promise<void>,
) => {
  await act(async () => {
    userEvent.click(screen.getByTestId(TX_MODAL.customButton));
    await waitForElementById(TX_MODAL.customInput);
    const input = getByTestId(TX_MODAL.customInput);
    if (action) {
      await action(input);
    }
    fireEvent.blur(input);
  });
};

const submitUpdate = async (getByTestId: (id: string) => HTMLElement) => {
  await act(async () => {
    fireEvent.click(getByTestId(TX_MODAL.submitButton));
    await waitForElementById(TX_MODAL.refElement);
  });
};

const expectButtonStates = (
  autoState: string | null,
  halfPercentState: string,
  twoPercentState: string,
  customState: string,
  customLabel = 'Custom',
) => {
  autoState && expect(screen.getByText('Auto')).toHaveClass(autoState);
  expect(screen.getByText('0.5%').parentElement).toHaveClass(halfPercentState);
  expect(screen.getByText('2%').parentElement).toHaveClass(twoPercentState);
  expect(screen.getByText(customLabel)).toHaveClass(customState);
};

const MUTED_CLASS = 'mm-box--background-color-background-muted';
const DEFAULT_CLASS = 'mm-box--background-color-icon-default';

describe('BridgeTransactionSettingsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(bridgeSelectors, 'getIsSolanaSwap').mockReturnValue(true);
  });

  it('should render the component, with initial state', async () => {
    jest.spyOn(bridgeSelectors, 'getIsSolanaSwap').mockReturnValue(false);
    const { getByTestId, baseElement } = renderModal();

    act(() => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expectButtonStates(null, MUTED_CLASS, MUTED_CLASS, MUTED_CLASS);

    // Click and blur Custom button
    await interactWithCustomInput(getByTestId);
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(baseElement.childNodes[2]).toMatchSnapshot();
  });

  it('should render the component, with initial Solana state', async () => {
    const { getByTestId, baseElement } = renderModal();

    openModal(getByTestId);
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expectButtonStates(DEFAULT_CLASS, MUTED_CLASS, MUTED_CLASS, MUTED_CLASS);

    // Click and blur Custom button
    await interactWithCustomInput(getByTestId, () => {
      expect(baseElement.childNodes[2]).toMatchSnapshot();
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
  });

  it('should render auto slippage amount', async () => {
    const initialSlippage = undefined;
    const { getByTestId, store } = renderModal(initialSlippage);

    await openModal(getByTestId);
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expectButtonStates(DEFAULT_CLASS, MUTED_CLASS, MUTED_CLASS, MUTED_CLASS);

    // Click and blur Custom button
    await interactWithCustomInput(getByTestId);
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

    // Change custom input to .
    await interactWithCustomInput(getByTestId, (input) => {
      userEvent.type(input, '.');
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent('Custom');

    // Change custom input to .0
    await interactWithCustomInput(getByTestId, (input) => {
      fireEvent.change(input, { target: { value: '.0' } });
    });
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent('.0');
    expect(getByTestId(TX_MODAL.submitButton)).toBeEnabled();
    expect(store.getState().bridge.slippage).toBe(initialSlippage);

    // Submit and expect 0
    await submitUpdate(getByTestId);
    expect(store.getState().bridge.slippage).toBe(0);

    // Reopen and expect 0 Custom button
    act(() => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
    });
    expectButtonStates(
      MUTED_CLASS,
      MUTED_CLASS,
      MUTED_CLASS,
      DEFAULT_CLASS,
      '0%',
    );
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
  });

  it('should render hardcoded slippage amount (0.5)', async () => {
    const initialSlippage = 0.5;
    const finalSlippage = '2';
    const { getByTestId, store } = renderModal(initialSlippage);

    await openModal(getByTestId);
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expectButtonStates(MUTED_CLASS, DEFAULT_CLASS, MUTED_CLASS, MUTED_CLASS);

    // Click and blur Custom button
    await interactWithCustomInput(getByTestId);
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

    // Change custom input to .5
    await interactWithCustomInput(getByTestId, (input) => {
      userEvent.type(input, '.5');
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(store.getState().bridge.slippage).toBe(initialSlippage);

    // Change custom input to 2
    await interactWithCustomInput(getByTestId, (input) => {
      fireEvent.change(input, { target: { value: finalSlippage } });
    });
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent(finalSlippage);
    expect(getByTestId(TX_MODAL.submitButton)).toBeEnabled();
    expect(store.getState().bridge.slippage).toBe(initialSlippage);

    // Submit and expect 2
    await submitUpdate(getByTestId);
    expect(store.getState().bridge.slippage).toBe(Number(finalSlippage));

    // Reopen and expect 2% Custom button
    act(() => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
    });
    expectButtonStates(MUTED_CLASS, MUTED_CLASS, DEFAULT_CLASS, MUTED_CLASS);
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

    // Click hardcoded 0.5 and submit
    await act(async () => {
      fireEvent.click(screen.getByText('0.5%'));
      fireEvent.click(getByTestId(TX_MODAL.submitButton));
    });
  });

  const VALID_VALUES = [
    ['1234', 1234],
    ['fas23.43', 23.43],
    ['fas23 ,43', 2343],
    ['23.4.3', 23.4],
    ['0.', 0],
    ['.0', 0],
  ] as const;

  const INVALID_VALUES = ['abc', '.', '', ' ', ','] as const;

  const testCustomInputValidation = (
    testName: string,
    setValue: (input: HTMLElement, value: string) => void | Promise<void>,
    shouldEnable: boolean,
  ) => {
    const action = shouldEnable ? 'enable' : 'disable';

    if (shouldEnable) {
      // @ts-expect-error - each is a valid test function
      it.each(VALID_VALUES)(
        `should validate ${testName} custom amount and ${action} submit button: %s`,
        async (value: string, expectedSlippage: number | undefined) => {
          const initialSlippage = undefined;
          const { getByTestId, store } = renderModal(initialSlippage);

          await openModal(getByTestId);
          expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

          await act(async () => {
            userEvent.click(screen.getByTestId(TX_MODAL.customButton));
            await waitForElementById(TX_MODAL.customInput);
            const input = getByTestId(TX_MODAL.customInput);
            await setValue(input, value);
            fireEvent.click(getByTestId(TX_MODAL.submitButton));
            await waitForElementById(TX_MODAL.refElement);
          });
          expect(store.getState().bridge.slippage).toBe(expectedSlippage);
        },
      );
    } else {
      // @ts-expect-error - each is a valid test function
      it.each(INVALID_VALUES)(
        `should validate ${testName} custom amount and ${action} submit button: %s`,
        async (value: string) => {
          const initialSlippage = undefined;
          const { getByTestId, store } = renderModal(initialSlippage);

          await openModal(getByTestId);
          expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

          await act(async () => {
            userEvent.click(screen.getByTestId(TX_MODAL.customButton));
            await waitForElementById(TX_MODAL.customInput);
            const input = getByTestId(TX_MODAL.customInput);
            await setValue(input, value);
            expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
            fireEvent.click(getByTestId(TX_MODAL.closeButton));
          });
          expect(store.getState().bridge.slippage).toBe(initialSlippage);
        },
      );
    }
  };

  testCustomInputValidation(
    'pasted',
    async (_input, value) => {
      await userEvent.paste(value);
    },
    true,
  );
  testCustomInputValidation(
    'pasted',
    async (_input, value) => {
      await userEvent.paste(value);
    },
    false,
  );
  testCustomInputValidation(
    'typed',
    (input, value) => {
      fireEvent.change(input, { target: { value } });
    },
    true,
  );
  testCustomInputValidation(
    'typed',
    (input, value) => {
      fireEvent.change(input, { target: { value } });
    },
    false,
  );
});
