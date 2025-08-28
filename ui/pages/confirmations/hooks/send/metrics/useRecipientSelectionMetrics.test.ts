import { MetaMetricsEventName } from '../../../../../../shared/constants/metametrics';
import mockTestState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { RecipientInputMethod } from '../../../context/send-metrics';

import { useSendType } from '../useSendType';
import { useRecipientSelectionMetrics } from './useRecipientSelectionMetrics';

const mockTrackEvent = jest.fn();
const mockCreateEventBuilder = jest.fn().mockReturnValue({
  addProperties: jest.fn().mockReturnValue({
    build: jest.fn().mockReturnValue({
      event: 'test_event',
      properties: {},
    }),
  }),
});

jest.mock('../../../../../hooks/useMetrics', () => ({
  ...jest.requireActual('../../../../../hooks/useMetrics'),
  useMetrics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: mockCreateEventBuilder,
  }),
}));

const mockSetRecipientInputMethod = jest.fn();

jest.mock('../../../context/send-context/send-metrics-context', () => ({
  ...jest.requireActual('../../../context/send-context/send-metrics-context'),
  useSendMetricsContext: () => ({
    accountType: 'EOA',
    recipientInputMethod: 'manual',
    setRecipientInputMethod: mockSetRecipientInputMethod,
  }),
}));

jest.mock('../../../context/send-context', () => ({
  useSendContext: () => ({
    chainId: '0x1',
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
    it('tracks recipient selected event with EVM properties when called for EVM chain', async () => {
      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
      );

      const expectedEventBuilder = {
        addProperties: jest.fn().mockReturnValue({
          build: jest.fn().mockReturnValue({ event: 'test_event' }),
        }),
      };
      mockCreateEventBuilder.mockReturnValue(expectedEventBuilder);

      await result.current.captureRecipientSelected();

      expect(mockCreateEventBuilder).toHaveBeenCalledWith(
        MetaMetricsEventName.SendRecipientSelected,
      );
      expect(expectedEventBuilder.addProperties).toHaveBeenCalledWith({
        account_type: 'EOA',
        input_method: 'manual',
        chain_id: '0x1',
        chain_id_caip: undefined,
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({ event: 'test_event' });
    });

    it('tracks recipient selected event with non-EVM properties when called for non-EVM chain', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseSendType.mockReturnValue({ isEvmSendType: false } as any);

      const { result } = renderHookWithProvider(
        () => useRecipientSelectionMetrics(),
        mockState,
      );

      const expectedEventBuilder = {
        addProperties: jest.fn().mockReturnValue({
          build: jest.fn().mockReturnValue({ event: 'test_event' }),
        }),
      };
      mockCreateEventBuilder.mockReturnValue(expectedEventBuilder);

      await result.current.captureRecipientSelected();

      expect(expectedEventBuilder.addProperties).toHaveBeenCalledWith({
        account_type: 'EOA',
        input_method: 'manual',
        chain_id: undefined,
        chain_id_caip: '0x1',
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
