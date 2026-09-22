import sendMaxValueReducer, {
  initialState,
  selectMaxValueModeForTransaction,
  setMaxValueMode,
} from './send-max-value';

describe('sendMaxValue', () => {
  describe('setMaxValueMode', () => {
    it('enables max value mode for a transaction', () => {
      const state = sendMaxValueReducer(
        initialState,
        setMaxValueMode({ transactionId: 'tx-1', enabled: true }),
      );

      expect(state.maxValueMode['tx-1']).toBe(true);
    });

    it('does not change max value mode for other transactions', () => {
      const withFirstTransaction = sendMaxValueReducer(
        initialState,
        setMaxValueMode({ transactionId: 'tx-1', enabled: true }),
      );

      const state = sendMaxValueReducer(
        withFirstTransaction,
        setMaxValueMode({ transactionId: 'tx-2', enabled: true }),
      );

      expect(state.maxValueMode).toStrictEqual({
        'tx-1': true,
        'tx-2': true,
      });
    });
  });

  describe('selectMaxValueModeForTransaction', () => {
    it('returns true only for the transaction with max value mode enabled', () => {
      const state = {
        sendMaxValue: {
          maxValueMode: {
            'tx-1': true,
          },
        },
      };

      expect(selectMaxValueModeForTransaction(state, 'tx-1')).toBe(true);
      expect(selectMaxValueModeForTransaction(state, 'tx-2')).toBe(false);
    });

    it('returns false when the transaction id is missing', () => {
      expect(
        selectMaxValueModeForTransaction({ sendMaxValue: initialState }),
      ).toBe(false);
    });
  });
});
