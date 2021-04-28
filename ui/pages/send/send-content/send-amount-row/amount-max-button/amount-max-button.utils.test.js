import { calcMaxAmount } from './amount-max-button.utils';

describe('amount-max-button utils', () => {
  describe('calcMaxAmount()', () => {
    it('should calculate the correct amount when no sendToken defined', () => {
      expect(
        calcMaxAmount({
          balance: 'ffffff',
          gasTotal: 'ff',
          sendToken: false,
        }),
      ).toStrictEqual('ffff00');
    });

    it('should calculate the correct amount when a sendToken is defined', () => {
      expect(
        calcMaxAmount({
          sendToken: {
            decimals: 10,
          },
          tokenBalance: '64',
        }),
      ).toStrictEqual('e8d4a51000');
    });
  });
});
