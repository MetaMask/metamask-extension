import * as React from 'react';
import { render } from '@testing-library/react';
import { SelectButton } from '.';

describe('SelectButton', () => {
  it('should render the SelectButton without crashing', () => {
    const { container } = render(<SelectButton />);
    expect(container).toMatchSnapshot();
  });

  it('should render the SelectButton with additional className', () => {
    const { getByTestId } = render(
      <SelectButton data-testid="classname" className="mm-test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-select-button mm-test');
  });
});
