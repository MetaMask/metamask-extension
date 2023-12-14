import * as React from 'react';
import { render } from '@testing-library/react';
import { List } from '.';

describe('List', () => {
  it('should render the List without crashing', () => {
    const { container } = render(<List>Test item</List>);
    expect(container).toMatchSnapshot();
  });

  it('should render the List with additional className', () => {
    const { getByTestId } = render(
      <List data-testid="classname" className="mm-test">
        Test item
      </List>,
    );
    expect(getByTestId('classname')).toHaveClass('mm-list mm-test');
  });

  it('should render the List children', () => {
    const { getByText } = render(
      <List data-testid="children">Test item children</List>,
    );
    expect(getByText('Test item children')).toBeTruthy();
  });
});
