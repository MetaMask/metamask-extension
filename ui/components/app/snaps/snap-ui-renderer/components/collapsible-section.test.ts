import { CollapsibleSection, Row, Text } from '@metamask/snaps-sdk/jsx';
import { fireEvent } from '@testing-library/react';
import { renderInterface } from '../test-utils';

describe('CollapsibleSection', () => {
  it('renders', () => {
    const { container } = renderInterface(
      CollapsibleSection({
        label: 'My Section',
        children: [
          Row({
            label: 'Row 1',
            children: Text({ children: 'Foo' }),
          }),
          Row({
            label: 'Row 2',
            children: Text({ children: 'Bar' }),
          }),
        ],
      }),
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__collapsible-section'),
    ).toHaveLength(1);
  });

  it('can expand', () => {
    const { container, getByText } = renderInterface(
      CollapsibleSection({
        label: 'My Section',
        children: [
          Row({
            label: 'Row 1',
            children: Text({ children: 'Foo' }),
          }),
          Row({
            label: 'Row 2',
            children: Text({ children: 'Bar' }),
          }),
        ],
      }),
    );

    const section = getByText('My Section');

    fireEvent.click(section);

    expect(getByText('Row 1')).toBeDefined();

    expect(container).toMatchSnapshot();
  });
});
