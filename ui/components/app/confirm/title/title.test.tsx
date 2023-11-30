import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmTitle } from './title';

describe('ConfirmTitle', () => {
  it('renders the title and description correctly', () => {
    const title = 'Confirmation Title';
    const description = 'Confirmation Description';

    const { getByText } = render(
      <ConfirmTitle title={title} description={description} />,
    );

    expect(getByText(title)).toBeInTheDocument();
    expect(getByText(description)).toBeInTheDocument();
  });
});
