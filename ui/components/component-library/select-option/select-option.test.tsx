import * as React from 'react';
import { render } from '@testing-library/react';
import { SelectOption } from '.';

describe('SelectOption', () => {
  it('should render the SelectOption without crashing', () => {
    const { container } = render(<SelectOption />);
    expect(container).toMatchSnapshot();
  });

  it('should render the SelectOption with additional className', () => {
    const { getByTestId } = render(
      <SelectOption data-testid="classname" className="mm-test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-select-option mm-test');
  });
});
