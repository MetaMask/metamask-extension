import { Box, DateTimePicker, Field } from '@metamask/snaps-sdk/jsx';
import { act, fireEvent, screen, within } from '@testing-library/react';
import * as backgroundConnection from '../../../../../store/background-connection';
import { MOCK_INTERFACE_ID, renderInterface } from '../test-utils';

jest.mock('../../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const { submitRequestToBackground } = jest.mocked(backgroundConnection);

// 2024-01-15 — used by fake timers so "today" is consistent across all tests.
const FIXED_DATE = new Date('2024-01-15T10:00:00.000Z');

describe('SnapUIDateTimePicker', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('snapshot', () => {
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

  describe('functionality', () => {
    it('open and click OK without interaction → today is committed and shown in input', () => {
      renderInterface(
        Box({ children: DateTimePicker({ name: 'picker', type: 'date' }) }),
      );

      act(() => {
        fireEvent.click(screen.getByRole('textbox', { hidden: true }));
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /ok/iu }));
      });

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'updateInterfaceState',
        [MOCK_INTERFACE_ID, { picker: expect.stringMatching(/^2024-01-15/u) }],
      );
      expect(screen.getByRole('textbox', { hidden: true })).toHaveValue(
        '01/15/2024',
      );
    });

    it('open, select a date, click OK → commits the selected date', () => {
      renderInterface(
        Box({ children: DateTimePicker({ name: 'picker', type: 'date' }) }),
      );

      act(() => {
        fireEvent.click(screen.getByRole('textbox', { hidden: true }));
      });

      act(() => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('gridcell', {
            name: '5',
          }),
        );
        fireEvent.click(screen.getByRole('button', { name: /ok/iu }));
      });

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'updateInterfaceState',
        [MOCK_INTERFACE_ID, { picker: expect.stringMatching(/^2024-01-05/u) }],
      );
    });

    it('open, cancel → no value is committed', () => {
      renderInterface(
        Box({ children: DateTimePicker({ name: 'picker', type: 'datetime' }) }),
      );

      act(() => {
        fireEvent.click(screen.getByRole('textbox', { hidden: true }));
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/iu }));
      });

      expect(submitRequestToBackground).not.toHaveBeenCalledWith(
        'updateInterfaceState',
        expect.anything(),
      );
    });

    it('set value, open, clear → clears to null immediately', () => {
      renderInterface(
        Box({
          children: DateTimePicker({ name: 'picker', type: 'datetime' }),
        }),
        { state: { picker: '2024-01-05T14:30:00.000Z' } },
      );

      act(() => {
        fireEvent.click(screen.getByRole('textbox', { hidden: true }));
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /clear/iu }));
      });

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'updateInterfaceState',
        [MOCK_INTERFACE_ID, { picker: null }],
      );
    });

    it('set value → input shows formatted date', () => {
      renderInterface(
        Box({ children: DateTimePicker({ name: 'picker', type: 'date' }) }),
        { state: { picker: '2024-01-05T14:30:00.000Z' } },
      );

      expect(screen.getByRole('textbox')).toHaveValue('01/05/2024');
    });

    it('draft resets after cancel — reopening the picker shows today highlighted', () => {
      renderInterface(
        Box({ children: DateTimePicker({ name: 'picker', type: 'date' }) }),
      );

      // First open: select day 5 then cancel
      act(() => {
        fireEvent.click(screen.getByRole('textbox', { hidden: true }));
      });
      act(() => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('gridcell', {
            name: '5',
          }),
        );
        fireEvent.click(screen.getByRole('button', { name: /cancel/iu }));
      });

      // Second open: cancel immediately
      act(() => {
        fireEvent.click(screen.getByRole('textbox', { hidden: true }));
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/iu }));
      });

      // Third open: today (the 15th) should still be highlighted
      act(() => {
        fireEvent.click(screen.getByRole('textbox', { hidden: true }));
      });

      const dialog = screen.getByRole('dialog');
      const selectedEl = dialog.querySelector('[aria-selected="true"]');
      expect(selectedEl?.textContent?.trim()).toBe('15');

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /ok/iu }));
      });

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'updateInterfaceState',
        [MOCK_INTERFACE_ID, { picker: expect.stringMatching(/^2024-01-15/u) }],
      );
    });
  });
});
