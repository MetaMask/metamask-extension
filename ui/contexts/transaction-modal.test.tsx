import React, { type ReactElement } from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import {
  TransactionModalContextProvider,
  useTransactionModalContext,
} from './transaction-modal';

describe('TransactionModalContext', () => {
  const wrapper = ({ children }: { children: ReactElement }) => (
    <TransactionModalContextProvider>
      {children}
    </TransactionModalContextProvider>
  );

  describe('useTransactionModalContext', () => {
    it('throws when used outside the provider', () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        const { result } = renderHook(() => useTransactionModalContext());

        expect(result.error).toEqual(
          new Error(
            'useTransactionModalContext must be used within a TransactionModalContextProvider',
          ),
        );
      } finally {
        consoleError.mockRestore();
      }
    });

    it('returns the initial modal state', () => {
      const { result } = renderHook(() => useTransactionModalContext(), {
        wrapper,
      });

      expect(result.current.currentModal).toBeUndefined();
      expect(result.current.openModalCount).toBe(0);
    });
  });

  describe('openModal', () => {
    it('opens a modal', () => {
      const { result } = renderHook(() => useTransactionModalContext(), {
        wrapper,
      });

      act(() => result.current.openModal('first'));

      expect(result.current.currentModal).toBe('first');
      expect(result.current.openModalCount).toBe(1);
    });

    it('does not open the same modal twice', () => {
      const { result } = renderHook(() => useTransactionModalContext(), {
        wrapper,
      });

      act(() => {
        result.current.openModal('first');
        result.current.openModal('first');
      });

      expect(result.current.currentModal).toBe('first');
      expect(result.current.openModalCount).toBe(1);
    });
  });

  describe('closeModal', () => {
    it('closes each requested modal', () => {
      const { result } = renderHook(() => useTransactionModalContext(), {
        wrapper,
      });

      act(() => {
        result.current.openModal('first');
      });
      act(() => {
        result.current.openModal('second');
      });
      act(() => {
        result.current.closeModal(['first', 'second']);
      });

      expect(result.current.currentModal).toBeUndefined();
      expect(result.current.openModalCount).toBe(0);
    });

    it('does not close another modal when the requested modal is not open', () => {
      const { result } = renderHook(() => useTransactionModalContext(), {
        wrapper,
      });

      act(() => result.current.openModal('first'));
      act(() => result.current.closeModal(['second']));

      expect(result.current.currentModal).toBe('first');
      expect(result.current.openModalCount).toBe(1);
    });
  });

  describe('closeAllModals', () => {
    it('closes every modal', () => {
      const { result } = renderHook(() => useTransactionModalContext(), {
        wrapper,
      });

      act(() => {
        result.current.openModal('first');
      });
      act(() => {
        result.current.openModal('second');
      });
      act(() => result.current.closeAllModals());

      expect(result.current.currentModal).toBeUndefined();
      expect(result.current.openModalCount).toBe(0);
    });
  });
});
