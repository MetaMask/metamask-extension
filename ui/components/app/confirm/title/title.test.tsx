import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmTitle } from './title';

describe('ConfirmTitle', () => {
  it('renders the title and subtitle correctly', () => {
    const title = 'Confirmation Title';
    const subtitle = 'Confirmation Subtitle';

    const { getByText } = render(
      <ConfirmTitle title={title} subtitle={subtitle} />,
    );

    expect(getByText(title)).toBeInTheDocument();
    expect(getByText(subtitle)).toBeInTheDocument();
  });
});
