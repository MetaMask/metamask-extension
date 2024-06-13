import React from 'react';
import { render } from '@testing-library/react';

import { ConfirmInfoRowDate } from './date';

describe('ConfirmInfoRowDate', () => {
  it('should match snapshot', () => {
    const { getByText } = render(
      <ConfirmInfoRowDate date={1633019124000} />,
    );
    expect(getByText('30 September 2021, 16:25')).toBeInTheDocument();
  });
});
