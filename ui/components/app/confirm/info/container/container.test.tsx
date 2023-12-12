import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmInfoContainer } from './container';

describe('ConfirmInfoContainer', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoContainer children={<>Mock content</>} />,
    );
    expect(container).toMatchSnapshot();
  });
});
