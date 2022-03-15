import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import LogoMoonPay from './logo-moonpay';

describe('LogoMoonPay', () => {
  it('renders the LogoMoonPay component', () => {
    const { container } = renderWithProvider(
      <LogoMoonPay className="deposit-ether-modal__logo logo-moonpay" />,
    );
    expect(container).toMatchSnapshot();
  });
});
