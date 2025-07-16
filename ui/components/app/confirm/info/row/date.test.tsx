import React from 'react';
import { render } from '@testing-library/react';

import { ConfirmInfoRowDate } from './date';

describe('ConfirmInfoRowDate', () => {
  it('should match snapshot', () => {
    const { getByText } = render(
      <ConfirmInfoRowDate unixTimestamp={1633019124} />,
    );
    expect(getByText('30 September 2021, 16:25')).toBeInTheDocument();
  });
});
