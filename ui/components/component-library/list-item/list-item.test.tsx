import * as React from 'react';
import { render } from '@testing-library/react';
import { ListItem } from '.';

describe('ListItem', () => {
  it('should render the ListItem without crashing', () => {
    const { container } = render(<ListItem />);
    expect(container).toMatchSnapshot();
  });

  it('should render the ListItem with additional className', () => {
    const { getByTestId } = render(
      <ListItem data-testid="classname" className="mm-test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-list-item mm-test');
  });
});
