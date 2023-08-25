import * as React from 'react';
import { render } from '@testing-library/react';
import { Template } from '.';

describe('Template', () => {
  it('should render the Template without crashing', () => {
    const { container } = render(<Template />);
    expect(container).toMatchSnapshot();
  });

  it('should render the Template with additional className', () => {
    const { getByTestId } = render(
      <Template data-testid="classname" className="mm-test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-template mm-test');
  });
});
