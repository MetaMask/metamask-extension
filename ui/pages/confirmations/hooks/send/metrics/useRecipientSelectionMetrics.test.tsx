import React, { ReactChildren } from 'react';
import mockTestState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { RecipientInputMethod } from '../../../context/send-metrics';

import { useSendType } from '../useSendType';
import { useRecipientSelectionMetrics } from './useRecipientSelectionMetrics';

const mockTrackEvent = jest.fn();

const Container = ({ children }: { children: ReactChildren }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

const mockSetRecipientInputMethod = jest.fn();

jest.mock('../../../context/send-metrics', () => ({
  ...jest.requireActual('../../../context/send-metrics'),
  useSendMetricsContext: () => ({
    accountType: 'EOA',
    recipientInputMethod: 'manual',
    setRecipientInputMethod: mockSetRecipientInputMethod,
  }),
}));

jest.mock('../../../context/send', () => ({
  useSendContext: () => ({
    asset: { chainId: '0x1' },
  }),
}));

jest.mock('../useSendType', () => ({
  useSendType: jest.fn(() => ({
    isEvmSendType: true,
  })),
}));

const mockUseSendType = useSendType as jest.MockedFunction<typeof useSendType>;

const mockState = {
  state: mockTestState,
};

describe('useRecipientSelectionMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSendType.mockReturnValue({ isEvmSendType: true } as any);
  });

  describe('setRecipientInputMethod functions', () => {
    it('sets recipient input method to Manual when setRecipientInputMethodManual is called', () => {
      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
      );

      result.current.setRecipientInputMethodManual();

      expect(mockSetRecipientInputMethod).toHaveBeenCalledWith(
        RecipientInputMethod.Manual,
      );
    });

    it('sets recipient input method to Pasted when setRecipientInputMethodPasted is called', () => {
      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
      );

      result.current.setRecipientInputMethodPasted();

      expect(mockSetRecipientInputMethod).toHaveBeenCalledWith(
        RecipientInputMethod.Pasted,
      );
    });

    it('sets recipient input method to SelectAccount when setRecipientInputMethodSelectAccount is called', () => {
      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
      );

      result.current.setRecipientInputMethodSelectAccount();

      expect(mockSetRecipientInputMethod).toHaveBeenCalledWith(
        RecipientInputMethod.SelectAccount,
      );
    });

    it('sets recipient input method to SelectContact when setRecipientInputMethodSelectContact is called', () => {
      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
      );

      result.current.setRecipientInputMethodSelectContact();

      expect(mockSetRecipientInputMethod).toHaveBeenCalledWith(
        RecipientInputMethod.SelectContact,
      );
    });
  });

  describe('captureRecipientSelected', () => {
    it('tracks recipient selected event with correct properties', async () => {
      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      await result.current.captureRecipientSelected();

      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: 'Send',
        event: 'Send Recipient Selected',
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'EOA',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id_caip: undefined,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          input_method: 'manual',
        },
      });
    });
  });

  describe('parameterized input method tests', () => {
    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['Manual', 'setRecipientInputMethodManual'],
      ['Pasted', 'setRecipientInputMethodPasted'],
      ['SelectAccount', 'setRecipientInputMethodSelectAccount'],
      ['SelectContact', 'setRecipientInputMethodSelectContact'],
    ] as const)(
      'calls setRecipientInputMethod with %s when %s is called',
      (inputMethod: keyof typeof RecipientInputMethod, methodName: string) => {
        const { result } = renderHookWithProvider(
          () => useRecipientSelectionMetrics(),
          mockState,
        );

        result.current[methodName]();

        expect(mockSetRecipientInputMethod).toHaveBeenCalledWith(
          RecipientInputMethod[inputMethod],
        );
      },
    );
  });

  describe('hook return values', () => {
    it('returns all expected functions', () => {
      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
      );

      expect(typeof result.current.captureRecipientSelected).toBe('function');
      expect(typeof result.current.setRecipientInputMethodManual).toBe(
        'function',
      );
      expect(typeof result.current.setRecipientInputMethodPasted).toBe(
        'function',
      );
      expect(typeof result.current.setRecipientInputMethodSelectAccount).toBe(
        'function',
      );
      expect(typeof result.current.setRecipientInputMethodSelectContact).toBe(
        'function',
      );
    });
  });
});
