import { Box, DateTimePicker } from '@metamask/snaps-sdk/jsx';
import { renderInterface } from '../test-utils';

const MOCK_SYSTEM_TIME = new Date('2026-06-02T21:43:00.000Z');

describe('SnapUIDateTimePicker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_SYSTEM_TIME);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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
});
