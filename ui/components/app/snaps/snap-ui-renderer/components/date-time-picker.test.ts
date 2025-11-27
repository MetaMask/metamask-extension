import { Box, DateTimePicker, Field } from '@metamask/snaps-sdk/jsx';
import { renderInterface } from '../test-utils';
import { fireEvent } from '@testing-library/react';

describe('SnapUIDateTimePicker', () => {
  it('renders a date time picker', () => {
    const { container } = renderInterface(
      Box({
        children: DateTimePicker({
          name: 'date-time-picker',
        }),
      }),
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__date-time-picker'),
    ).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  it('renders a date picker', () => {
    const { container } = renderInterface(
      Box({
        children: DateTimePicker({
          name: 'date-picker',
          type: 'date',
        }),
      }),
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__date-time-picker'),
    ).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  it('renders a time picker', () => {
    const { container } = renderInterface(
      Box({
        children: DateTimePicker({
          name: 'time-picker',
          type: 'time',
        }),
      }),
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__date-time-picker'),
    ).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  it('renders inside a field', () => {
    const { container, getByText } = renderInterface(
      Box({
        children: Field({
          label: 'Select date and time',
          children: DateTimePicker({
            name: 'date-time-picker',
          }),
        }),
      }),
    );

    expect(getByText('Select date and time')).toBeInTheDocument();
    expect(
      container.getElementsByClassName('snap-ui-renderer__date-time-picker'),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('can show an error', () => {
    const { container, getByText } = renderInterface(
      Box({
        children: Field({
          label: 'Select date and time',
          error: 'This is an error',
          children: DateTimePicker({
            name: 'date-time-picker',
          }),
        }),
      }),
    );

    expect(getByText('Select date and time')).toBeInTheDocument();
    expect(getByText('This is an error')).toBeInTheDocument();
    expect(
      container.getElementsByClassName('snap-ui-renderer__date-time-picker'),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });
});
