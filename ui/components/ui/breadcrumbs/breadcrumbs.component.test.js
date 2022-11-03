import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Breadcrumbs from '.';

describe('Breadcrumbs Component', () => {
  it('should match snapshot with multiple breakcumbs', () => {
    const props = {
      currentIndex: 1,
      total: 3,
    };

    const { container } = renderWithProvider(<Breadcrumbs {...props} />);

    expect(container).toMatchSnapshot();
  });
});
