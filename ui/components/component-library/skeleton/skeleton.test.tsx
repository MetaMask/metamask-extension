import React from 'react';
import { render } from '@testing-library/react';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('should render Skeleton without error', () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" />);
    expect(getByTestId('skeleton')).toBeDefined();
    expect(getByTestId('skeleton')).toHaveClass('mm-skeleton');
  });
  it('should match snapshot', () => {
    const { container } = render(<Skeleton />);
    expect(container).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByTestId } = render(
      <Skeleton data-testid="skeleton" className="test-class" />,
    );
    expect(getByTestId('skeleton')).toHaveClass('test-class');
  });
  it('should render the children and not the skeleton when isLoading is false', () => {
    const { getByTestId } = render(
      <Skeleton isLoading={false}>
        <div data-testid="content">Content</div>
      </Skeleton>,
    );
    expect(getByTestId('content')).toBeInTheDocument();
  });
});
