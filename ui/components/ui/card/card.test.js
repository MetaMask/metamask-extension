import { render } from '@testing-library/react';
import * as React from 'react';

import Card from '.';

describe('Card', () => {
  it('should render the Card without crashing', () => {
    const { getByText } = render(<Card>Card content</Card>);

    expect(getByText('Card content')).toBeDefined();
  });
});
