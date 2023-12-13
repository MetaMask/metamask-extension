import * as React from 'react';
import { render } from '@testing-library/react';
import { ListItem } from '.';

describe('ListItem', () => {
  it('should render the ListItem without crashing', () => {
    const { container } = render(<ListItem>Test item</ListItem>);
    expect(container).toMatchSnapshot();
  });

  it('should render the ListItem with additional className', () => {
    const { getByTestId } = render(
      <ListItem data-testid="classname" className="mm-test">
        Test item
      </ListItem>,
    );
    expect(getByTestId('classname')).toHaveClass('mm-list-item mm-test');
  });

  it('should render the ListItem as disabled', () => {
    const { getByTestId } = render(
      <ListItem data-testid="disabled" className="mm-test" isDisabled>
        Test item
      </ListItem>,
    );
    expect(getByTestId('disabled')).toHaveClass('mm-list-item--disabled');
  });

  it('should render the ListItem children', () => {
    const { getByText } = render(
      <ListItem data-testid="children">Test item children</ListItem>,
    );
    expect(getByText('Test item children')).toBeTruthy();
  });
});
