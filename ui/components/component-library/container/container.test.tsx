import * as React from 'react';
import { render } from '@testing-library/react';
import { Container } from '.';

describe('Container', () => {
  it('should render the Container without crashing', () => {
    const { container } = render(<Container />);
    expect(container).toMatchSnapshot();
  });

  it('should render the Container with additional className', () => {
    const { getByTestId } = render(
      <Container data-testid="classname" className="mm-test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-container mm-test');
  });
});
