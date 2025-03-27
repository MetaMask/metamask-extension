import { Container, Box, Text, Footer, Button } from '@metamask/snaps-sdk/jsx';
import { fireEvent } from '@testing-library/react';
import { renderInterface } from '../test-utils';

describe('SnapUIFooter', () => {
  it('renders footers', () => {
    const { container, getByText } = renderInterface(
      Container({
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      { useFooter: true },
    );

    expect(getByText('Foo')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('supports the onCancel prop', () => {
    const onCancel = jest.fn();
    const { container, getByText } = renderInterface(
      Container({
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      { useFooter: true, onCancel },
    );

    const button = getByText('Cancel');
    expect(button).toBeDefined();
    expect(container).toMatchSnapshot();

    fireEvent.click(button);
    expect(onCancel).toHaveBeenCalled();
  });
});
