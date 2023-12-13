import * as React from 'react';
import { render } from '@testing-library/react';
import { ListItemSelect } from '.';

describe('ListItemSelect', () => {
  it('should render the ListItemSelect without crashing', () => {
    const { container } = render(<ListItemSelect>Test item</ListItemSelect>);
    expect(container).toMatchSnapshot();
  });

  it('should render the ListItemSelect with additional className', () => {
    const { getByTestId } = render(
      <ListItemSelect data-testid="classname" className="mm-test">
        Test item
      </ListItemSelect>,
    );
    expect(getByTestId('classname')).toHaveClass('mm-list-item-select mm-test');
  });

  it('should render the ListItemSelect as disabled', () => {
    const { getByTestId } = render(
      <ListItemSelect data-testid="disabled" className="mm-test" isDisabled>
        Test item
      </ListItemSelect>,
    );
    expect(getByTestId('disabled')).toHaveClass(
      'mm-list-item-select--disabled',
    );
  });

  it('should render the ListItemSelect children', () => {
    const { getByText } = render(
      <ListItemSelect data-testid="children">
        Test item children
      </ListItemSelect>,
    );
    expect(getByText('Test item children')).toBeTruthy();
  });
});
