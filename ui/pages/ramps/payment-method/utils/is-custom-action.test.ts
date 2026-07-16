import type { Quote } from '@metamask/ramps-controller';
import { isCustomAction } from './is-custom-action';

describe('isCustomAction', () => {
  it('matches snapshot for custom-action and standard quotes', () => {
    const customAction: Quote = {
      provider: '/providers/paypal',
      quote: {
        amountIn: 100,
        amountOut: '0.01',
        paymentMethod: '/payments/paypal',
        isCustomAction: true,
      } as Quote['quote'] & { isCustomAction: boolean },
    };
    const standard: Quote = {
      provider: '/providers/test',
      quote: {
        amountIn: 100,
        amountOut: '0.01',
        paymentMethod: '/payments/card',
      },
    };

    expect({
      customAction: isCustomAction(customAction),
      standard: isCustomAction(standard),
    }).toMatchSnapshot();
  });
});
