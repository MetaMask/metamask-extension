import React, { ReactElement } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { render, fireEvent } from '@testing-library/react';
import { GasModalType } from '../../constants/gas';
import {
  GasFeeModalContextProvider,
  GasFeeModalWrapper,
  useGasFeeModalContext,
} from '.';

jest.mock('../../components/modals/gas-fee-modal/gas-fee-modal', () => ({
  GasFeeModal: ({
    setGasModalVisible,
    initialModalType,
  }: {
    setGasModalVisible: () => void;
    initialModalType: GasModalType;
  }) => (
    <div data-testid="gas-fee-modal" data-initial-type={initialModalType}>
      <button data-testid="close-modal" onClick={setGasModalVisible}>
        Close
      </button>
    </div>
  ),
}));

describe('GasFeeModalContext', () => {
  const wrapper = ({ children }: { children: ReactElement }) => (
    <GasFeeModalContextProvider>{children}</GasFeeModalContextProvider>
  );

  describe('useGasFeeModalContext', () => {
    it('throws error when used outside of provider', () => {
      const { result } = renderHook(() => useGasFeeModalContext());

      expect(result.error).toEqual(
        new Error(
          'useGasFeeModalContext must be used within a GasFeeModalContextProvider',
        ),
      );
    });

    it('returns initial state', () => {
      const { result } = renderHook(() => useGasFeeModalContext(), { wrapper });

      expect(result.current.isGasFeeModalVisible).toBe(false);
      expect(result.current.initialModalType).toBe(GasModalType.EstimatesModal);
    });
  });

  describe('openGasFeeModal', () => {
    it('sets visibility to true with default modal type', () => {
      const { result } = renderHook(() => useGasFeeModalContext(), { wrapper });

      act(() => {
        result.current.openGasFeeModal();
      });

      expect(result.current.isGasFeeModalVisible).toBe(true);
      expect(result.current.initialModalType).toBe(GasModalType.EstimatesModal);
    });

    it('sets visibility to true with specified modal type', () => {
      const { result } = renderHook(() => useGasFeeModalContext(), { wrapper });

      act(() => {
        result.current.openGasFeeModal(GasModalType.AdvancedEIP1559Modal);
      });

      expect(result.current.isGasFeeModalVisible).toBe(true);
      expect(result.current.initialModalType).toBe(
        GasModalType.AdvancedEIP1559Modal,
      );
    });

    it('sets visibility to true with AdvancedGasPriceModal type', () => {
      const { result } = renderHook(() => useGasFeeModalContext(), { wrapper });

      act(() => {
        result.current.openGasFeeModal(GasModalType.AdvancedGasPriceModal);
      });

      expect(result.current.isGasFeeModalVisible).toBe(true);
      expect(result.current.initialModalType).toBe(
        GasModalType.AdvancedGasPriceModal,
      );
    });
  });

  describe('closeGasFeeModal', () => {
    it('sets visibility to false', () => {
      const { result } = renderHook(() => useGasFeeModalContext(), { wrapper });

      act(() => {
        result.current.openGasFeeModal();
      });

      expect(result.current.isGasFeeModalVisible).toBe(true);

      act(() => {
        result.current.closeGasFeeModal();
      });

      expect(result.current.isGasFeeModalVisible).toBe(false);
    });
  });

  describe('GasFeeModalWrapper', () => {
    const TestComponent = ({ onOpen }: { onOpen?: () => void }) => {
      const { openGasFeeModal } = useGasFeeModalContext();
      return (
        <>
          <button
            data-testid="open-modal"
            onClick={() => {
              openGasFeeModal();
              onOpen?.();
            }}
          >
            Open
          </button>
          <GasFeeModalWrapper />
        </>
      );
    };

    it('does not render modal when not visible', () => {
      const { queryByTestId } = render(
        <GasFeeModalContextProvider>
          <GasFeeModalWrapper />
        </GasFeeModalContextProvider>,
      );

      expect(queryByTestId('gas-fee-modal')).not.toBeInTheDocument();
    });

    it('renders modal when visible', () => {
      const { getByTestId } = render(
        <GasFeeModalContextProvider>
          <TestComponent />
        </GasFeeModalContextProvider>,
      );

      fireEvent.click(getByTestId('open-modal'));

      expect(getByTestId('gas-fee-modal')).toBeInTheDocument();
    });

    it('closes modal when close is triggered', () => {
      const { getByTestId, queryByTestId } = render(
        <GasFeeModalContextProvider>
          <TestComponent />
        </GasFeeModalContextProvider>,
      );

      fireEvent.click(getByTestId('open-modal'));
      expect(getByTestId('gas-fee-modal')).toBeInTheDocument();

      fireEvent.click(getByTestId('close-modal'));
      expect(queryByTestId('gas-fee-modal')).not.toBeInTheDocument();
    });
  });
});
