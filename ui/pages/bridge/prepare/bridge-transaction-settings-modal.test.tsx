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

describe('BridgeTransactionSettingsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(bridgeSelectors, 'getIsSolanaSwap').mockReturnValue(true);
  });

  it('should render the component, with initial state', async () => {
    const mockStore = createBridgeMockStore();
    const store = configureStore(mockStore);
    const { getByTestId, baseElement } = renderWithProvider(
      <CrossChainSwap />,
      store,
      CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
    );

    act(() => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(screen.getByText('Auto')).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('0.5%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('2%').parentElement).toHaveClass(
      'mm-box--background-color-icon-default',
    );
    expect(screen.getByText('Custom')).toHaveClass(
      'mm-box--background-color-background-muted',
    );

    // Click and blur Custom button
    await act(async () => {
      userEvent.click(screen.getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      expect(baseElement.childNodes[2]).toMatchSnapshot();
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(baseElement.childNodes[2]).toMatchSnapshot();

    // Change custom input to .
    await act(async () => {
      userEvent.click(screen.getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      userEvent.type(getByTestId(TX_MODAL.customInput), '.');
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent('Custom');

    // Change custom input to .0
    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      fireEvent.change(getByTestId(TX_MODAL.customInput), {
        target: { value: '.0' },
      });
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent('.0');
    expect(getByTestId(TX_MODAL.submitButton)).toBeEnabled();
    expect(store.getState().bridge.slippage).toBe(2);

    // Submit and expect 0
    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.submitButton));
      await waitForElementById(TX_MODAL.refElement);
    });
    expect(store.getState().bridge.slippage).toBe(0);

    // Reopen and expect 0 Custom button
    act(() => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
    });
    expect(screen.getByText('Auto')).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('0.5%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('2%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('0%')).toHaveClass(
      'mm-box--background-color-icon-default',
    );
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
  });

  it('should render auto slippage amount', async () => {
    const mockStore = createBridgeMockStore();
    const initialSlippage = undefined;
    const store = configureStore(mockStore);
    const { getByTestId } = renderWithProvider(
      <CrossChainSwap />,
      store,
      CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
    );
    store.dispatch(setSlippage(initialSlippage));

    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
      await waitForElementById(TX_MODAL.submitButton);
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(screen.getByText('Auto')).toHaveClass(
      'mm-box--background-color-icon-default',
    );
    expect(screen.getByText('0.5%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('2%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('Custom')).toHaveClass(
      'mm-box--background-color-background-muted',
    );

    // Click and blur Custom button
    await act(async () => {
      userEvent.click(screen.getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

    // Change custom input to .
    await act(async () => {
      userEvent.click(screen.getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      userEvent.type(getByTestId(TX_MODAL.customInput), '.');
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent('Custom');

    // Change custom input to .0
    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      fireEvent.change(getByTestId(TX_MODAL.customInput), {
        target: { value: '.0' },
      });
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent('.0');
    expect(getByTestId(TX_MODAL.submitButton)).toBeEnabled();
    expect(store.getState().bridge.slippage).toBe(initialSlippage);

    // Submit and expect 0
    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.submitButton));
      await waitForElementById(TX_MODAL.refElement);
    });
    expect(store.getState().bridge.slippage).toBe(0);

    // Reopen and expect 0 Custom button
    act(() => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
    });
    expect(screen.getByText('Auto')).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('0.5%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('2%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('0%')).toHaveClass(
      'mm-box--background-color-icon-default',
    );
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
  });

  it('should render hardcoded slippage amount (0.5)', async () => {
    const mockStore = createBridgeMockStore();
    const initialSlippage = 0.5;
    const finalSlippage = '2';
    const store = configureStore(mockStore);
    const { getByTestId } = renderWithProvider(
      <CrossChainSwap />,
      store,
      CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
    );
    store.dispatch(setSlippage(initialSlippage));

    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
      await waitForElementById(TX_MODAL.submitButton);
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(screen.getByText('Auto')).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('0.5%').parentElement).toHaveClass(
      'mm-box--background-color-icon-default',
    );
    expect(screen.getByText('2%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('Custom')).toHaveClass(
      'mm-box--background-color-background-muted',
    );

    // Click and blur Custom button
    await act(async () => {
      userEvent.click(screen.getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

    // Change custom input to .5
    await act(async () => {
      userEvent.click(screen.getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      userEvent.type(getByTestId(TX_MODAL.customInput), '.5');
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
    expect(store.getState().bridge.slippage).toBe(initialSlippage);

    // Change custom input to 2
    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.customButton));
      await waitForElementById(TX_MODAL.customInput);
      fireEvent.change(getByTestId(TX_MODAL.customInput), {
        target: { value: finalSlippage },
      });
      fireEvent.blur(getByTestId(TX_MODAL.customInput));
    });
    expect(getByTestId(TX_MODAL.customButton)).toHaveTextContent(finalSlippage);
    expect(getByTestId(TX_MODAL.submitButton)).toBeEnabled();
    expect(store.getState().bridge.slippage).toBe(initialSlippage);

    // Submit and expect 2
    await act(async () => {
      fireEvent.click(getByTestId(TX_MODAL.submitButton));
      await waitForElementById(TX_MODAL.refElement);
    });
    expect(store.getState().bridge.slippage).toBe(Number(finalSlippage));

    // Reopen and expect 2% Custom button
    act(() => {
      fireEvent.click(getByTestId(TX_MODAL.refElement));
    });
    expect(screen.getByText('Auto')).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('0.5%').parentElement).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(screen.getByText('2%').parentElement).toHaveClass(
      'mm-box--background-color-icon-default',
    );
    expect(screen.getByText('Custom')).toHaveClass(
      'mm-box--background-color-background-muted',
    );
    expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

    // Click hardcoded 0.5 and submit
    await act(async () => {
      fireEvent.click(screen.getByText('0.5%'));
      fireEvent.click(getByTestId(TX_MODAL.submitButton));
    });
  });

  // @ts-expect-error - each is a valid test function
  it.each([
    ['1234', 1234],
    ['fas23.43', 23.43],
    ['fas23 ,43', 2343],
    ['23.4.3', 23.4],
    ['0.', 0],
    ['.0', 0],
  ])(
    'should validate pasted custom amount and enable submit button: %s',
    async (pastedValue: string, finalSlippage: number | undefined) => {
      const mockStore = createBridgeMockStore();
      const initialSlippage = undefined;
      const store = configureStore(mockStore);
      const { getByTestId } = renderWithProvider(
        <CrossChainSwap />,
        store,
        CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
      );
      store.dispatch(setSlippage(initialSlippage));

      await act(async () => {
        fireEvent.click(getByTestId(TX_MODAL.refElement));
        await waitForElementById(TX_MODAL.submitButton);
      });
      expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

      // Paste into custom input
      await act(async () => {
        userEvent.click(screen.getByTestId(TX_MODAL.customButton));
        await waitForElementById(TX_MODAL.customInput);
        userEvent.paste(pastedValue);
        fireEvent.click(getByTestId(TX_MODAL.submitButton));
        await waitForElementById(TX_MODAL.refElement);
      });

      expect(store.getState().bridge.slippage).toBe(finalSlippage);
    },
  );

  // @ts-expect-error - each is a valid test function
  it.each(['abc', '.', '', ' ', ','])(
    'should validate pasted custom amount and disable submit button: %s',
    async (pastedValue: string) => {
      const mockStore = createBridgeMockStore();
      const initialSlippage = undefined;
      const store = configureStore(mockStore);
      const { getByTestId } = renderWithProvider(
        <CrossChainSwap />,
        store,
        CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
      );
      store.dispatch(setSlippage(initialSlippage));

      await act(async () => {
        fireEvent.click(getByTestId(TX_MODAL.refElement));
        await waitForElementById(TX_MODAL.submitButton);
      });
      expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

      // Paste into custom input
      await act(async () => {
        userEvent.click(screen.getByTestId(TX_MODAL.customButton));
        await waitForElementById(TX_MODAL.customInput);
        userEvent.paste(pastedValue);
        expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
        fireEvent.click(getByTestId(TX_MODAL.closeButton));
      });
      expect(store.getState().bridge.slippage).toBe(initialSlippage);
    },
  );

  // @ts-expect-error - each is a valid test function
  it.each([
    ['1234', 1234],
    ['fas23.43', 23.43],
    ['fas23,43', 2343],
    ['23.4.3', 23.4],
    ['0.', 0],
    ['.0', 0],
  ])(
    'should validate typed custom amount and enable submit button: %s',
    async (newValue: string, finalSlippage: number | undefined) => {
      const mockStore = createBridgeMockStore();
      const initialSlippage = undefined;
      const store = configureStore(mockStore);
      const { getByTestId } = renderWithProvider(
        <CrossChainSwap />,
        store,
        CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
      );
      store.dispatch(setSlippage(initialSlippage));

      await act(async () => {
        fireEvent.click(getByTestId(TX_MODAL.refElement));
        await waitForElementById(TX_MODAL.submitButton);
      });
      expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

      // Paste into custom input
      await act(async () => {
        userEvent.click(screen.getByTestId(TX_MODAL.customButton));
        await waitForElementById(TX_MODAL.customInput);
        fireEvent.change(getByTestId(TX_MODAL.customInput), {
          target: { value: newValue },
        });
        fireEvent.click(getByTestId(TX_MODAL.submitButton));
        await waitForElementById(TX_MODAL.refElement);
      });

      expect(store.getState().bridge.slippage).toBe(finalSlippage);
    },
  );

  // @ts-expect-error - each is a valid test function
  it.each(['abc', '.', '', ' ', ','])(
    'should validate typed custom amount and disable submit button: %s',
    async (newValue: string) => {
      const mockStore = createBridgeMockStore();
      const initialSlippage = undefined;
      const store = configureStore(mockStore);
      const { getByTestId } = renderWithProvider(
        <CrossChainSwap />,
        store,
        CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE,
      );
      store.dispatch(setSlippage(initialSlippage));

      await act(async () => {
        fireEvent.click(getByTestId(TX_MODAL.refElement));
        await waitForElementById(TX_MODAL.submitButton);
      });
      expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();

      // Paste into custom input
      await act(async () => {
        userEvent.click(screen.getByTestId(TX_MODAL.customButton));
        await waitForElementById(TX_MODAL.customInput);
        fireEvent.change(getByTestId(TX_MODAL.customInput), {
          target: { value: newValue },
        });
        expect(getByTestId(TX_MODAL.submitButton)).toBeDisabled();
        fireEvent.click(getByTestId(TX_MODAL.closeButton));
      });
      expect(store.getState().bridge.slippage).toBe(initialSlippage);
    },
  );
});
