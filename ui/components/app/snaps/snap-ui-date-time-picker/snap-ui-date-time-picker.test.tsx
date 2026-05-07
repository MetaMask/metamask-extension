import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { DateTime } from 'luxon';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { SnapUIDateTimePicker } from './snap-ui-date-time-picker';

jest.mock('../../../../contexts/snaps', () => ({
  useSnapInterfaceContext: jest.fn(),
}));

jest.mock('@mui/x-date-pickers/DateTimePicker', () => ({
  DateTimePicker: jest.fn(),
}));

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: jest.fn(),
}));

jest.mock('@mui/x-date-pickers/TimePicker', () => ({
  TimePicker: jest.fn(),
}));

const mockDateTimePicker = DateTimePicker as jest.Mock;
const mockDatePicker = DatePicker as jest.Mock;
const mockTimePicker = TimePicker as jest.Mock;
const mockUseSnapInterfaceContext = useSnapInterfaceContext as jest.Mock;

const MOCK_DATETIME = DateTime.fromISO('2024-01-15T10:30:45.123Z');

describe('SnapUIDateTimePicker', () => {
  const mockHandleInputChange = jest.fn();
  const mockGetValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValue.mockReturnValue(undefined);
    mockUseSnapInterfaceContext.mockReturnValue({
      handleInputChange: mockHandleInputChange,
      getValue: mockGetValue,
    });

    mockDateTimePicker.mockImplementation(
      ({ className, disabled, disablePast, disableFuture }) => (
        <div
          data-testid="mock-datetime-picker"
          className={className}
          data-disabled={disabled ? 'true' : undefined}
          data-disable-past={disablePast ? 'true' : undefined}
          data-disable-future={disableFuture ? 'true' : undefined}
        />
      ),
    );

    mockDatePicker.mockImplementation(
      ({ className, disabled, disablePast, disableFuture }) => (
        <div
          data-testid="mock-date-picker"
          className={className}
          data-disabled={disabled ? 'true' : undefined}
          data-disable-past={disablePast ? 'true' : undefined}
          data-disable-future={disableFuture ? 'true' : undefined}
        />
      ),
    );

    mockTimePicker.mockImplementation(({ className, disabled }) => (
      <div
        data-testid="mock-time-picker"
        className={className}
        data-disabled={disabled ? 'true' : undefined}
      />
    ));
  });

  describe('rendering', () => {
    it('renders a datetime picker for type "datetime"', () => {
      const { container } = render(
        <SnapUIDateTimePicker name="test" type="datetime" />,
      );

      expect(screen.getByTestId('mock-datetime-picker')).toBeInTheDocument();
      expect(
        container.querySelector('.snap-ui-renderer__date-time-picker'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('mock-date-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-time-picker')).not.toBeInTheDocument();
    });

    it('renders a date picker for type "date"', () => {
      render(<SnapUIDateTimePicker name="test" type="date" />);

      expect(screen.getByTestId('mock-date-picker')).toBeInTheDocument();
      expect(
        screen.queryByTestId('mock-datetime-picker'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-time-picker')).not.toBeInTheDocument();
    });

    it('renders a time picker for type "time"', () => {
      render(<SnapUIDateTimePicker name="test" type="time" />);

      expect(screen.getByTestId('mock-time-picker')).toBeInTheDocument();
      expect(
        screen.queryByTestId('mock-datetime-picker'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-date-picker')).not.toBeInTheDocument();
    });

    it('renders a label when provided', () => {
      render(
        <SnapUIDateTimePicker name="test" type="datetime" label="Pick a date" />,
      );

      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });

    it('does not render a label when not provided', () => {
      const { container } = render(
        <SnapUIDateTimePicker name="test" type="datetime" />,
      );

      expect(container.querySelector('label')).not.toBeInTheDocument();
    });

    it('renders an error message when provided', () => {
      render(
        <SnapUIDateTimePicker
          name="test"
          type="datetime"
          error="Invalid date"
        />,
      );

      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });

    it('does not render an error when not provided', () => {
      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument();
    });

    it('applies the snap-ui-renderer__field class when a label is provided', () => {
      const { container } = render(
        <SnapUIDateTimePicker name="test" type="datetime" label="Date" />,
      );

      expect(
        container.querySelector('.snap-ui-renderer__field'),
      ).toBeInTheDocument();
    });

    it('does not apply the snap-ui-renderer__field class without a label', () => {
      const { container } = render(
        <SnapUIDateTimePicker name="test" type="datetime" />,
      );

      expect(
        container.querySelector('.snap-ui-renderer__field'),
      ).not.toBeInTheDocument();
    });

    it('passes the disabled prop to the datetime picker', () => {
      render(<SnapUIDateTimePicker name="test" type="datetime" disabled />);

      expect(
        screen.getByTestId('mock-datetime-picker').getAttribute('data-disabled'),
      ).toBe('true');
    });

    it('passes the disabled prop to the date picker', () => {
      render(<SnapUIDateTimePicker name="test" type="date" disabled />);

      expect(
        screen.getByTestId('mock-date-picker').getAttribute('data-disabled'),
      ).toBe('true');
    });

    it('passes the disabled prop to the time picker', () => {
      render(<SnapUIDateTimePicker name="test" type="time" disabled />);

      expect(
        screen.getByTestId('mock-time-picker').getAttribute('data-disabled'),
      ).toBe('true');
    });

    it('passes the disablePast prop to the datetime picker', () => {
      render(<SnapUIDateTimePicker name="test" type="datetime" disablePast />);

      expect(
        screen
          .getByTestId('mock-datetime-picker')
          .getAttribute('data-disable-past'),
      ).toBe('true');
    });

    it('passes the disableFuture prop to the date picker', () => {
      render(<SnapUIDateTimePicker name="test" type="date" disableFuture />);

      expect(
        screen
          .getByTestId('mock-date-picker')
          .getAttribute('data-disable-future'),
      ).toBe('true');
    });

    it('passes the correct class to the datetime picker', () => {
      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      expect(
        screen.getByTestId('mock-datetime-picker').className,
      ).toContain('snap-ui-renderer__date-time-picker--datetime');
    });

    it('passes the correct class to the date picker', () => {
      render(<SnapUIDateTimePicker name="test" type="date" />);

      expect(screen.getByTestId('mock-date-picker').className).toContain(
        'snap-ui-renderer__date-time-picker--date',
      );
    });

    it('passes the correct class to the time picker', () => {
      render(<SnapUIDateTimePicker name="test" type="time" />);

      expect(screen.getByTestId('mock-time-picker').className).toContain(
        'snap-ui-renderer__date-time-picker--time',
      );
    });
  });

  describe('initial value', () => {
    it('initializes with the ISO value from context', () => {
      const iso = '2024-01-15T10:30:00.000Z';
      mockGetValue.mockReturnValue(iso);

      let receivedValue: DateTime | null | undefined;
      mockDateTimePicker.mockImplementation(({ value }) => {
        receivedValue = value;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      expect(mockGetValue).toHaveBeenCalledWith('test', undefined);
      expect(receivedValue?.toISO()).toBe(DateTime.fromISO(iso).toISO());
    });

    it('initializes with null when no value is in context', () => {
      mockGetValue.mockReturnValue(undefined);

      let receivedValue: DateTime | null | undefined;
      mockDateTimePicker.mockImplementation(({ value }) => {
        receivedValue = value;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      expect(receivedValue).toBeNull();
    });

    it('passes the form parameter to getValue', () => {
      render(
        <SnapUIDateTimePicker name="test" type="datetime" form="my-form" />,
      );

      expect(mockGetValue).toHaveBeenCalledWith('test', 'my-form');
    });

    it('updates internal value when initialValue changes', () => {
      mockGetValue.mockReturnValue('2024-01-15T00:00:00.000Z');

      const receivedValues: (DateTime | null)[] = [];
      mockDateTimePicker.mockImplementation(({ value }) => {
        receivedValues.push(value);
        return <div data-testid="mock-datetime-picker" />;
      });

      const { rerender } = render(
        <SnapUIDateTimePicker name="test" type="datetime" />,
      );

      const newIso = '2024-06-20T12:00:00.000Z';
      mockGetValue.mockReturnValue(newIso);

      act(() => {
        rerender(<SnapUIDateTimePicker name="test" type="datetime" />);
      });

      const lastValue = receivedValues[receivedValues.length - 1];
      expect(lastValue?.toISO()).toBe(DateTime.fromISO(newIso).toISO());
    });
  });

  describe('handleChange', () => {
    it('calls handleInputChange with the ISO string for datetime type', () => {
      let capturedOnChange: (date: DateTime | null) => void = jest.fn();
      mockDateTimePicker.mockImplementation(({ onChange }) => {
        capturedOnChange = onChange;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      act(() => {
        capturedOnChange(MOCK_DATETIME);
      });

      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        MOCK_DATETIME.toISO(),
        undefined,
      );
    });

    it('normalizes date type to midnight when calling handleInputChange', () => {
      let capturedOnChange: (date: DateTime | null) => void = jest.fn();
      mockDatePicker.mockImplementation(({ onChange }) => {
        capturedOnChange = onChange;
        return <div data-testid="mock-date-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="date" />);

      act(() => {
        capturedOnChange(MOCK_DATETIME);
      });

      const expectedDate = MOCK_DATETIME.set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        expectedDate.toISO(),
        undefined,
      );
    });

    it('normalizes time type by clearing seconds and milliseconds', () => {
      let capturedOnChange: (date: DateTime | null) => void = jest.fn();
      mockTimePicker.mockImplementation(({ onChange }) => {
        capturedOnChange = onChange;
        return <div data-testid="mock-time-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="time" />);

      act(() => {
        capturedOnChange(MOCK_DATETIME);
      });

      const expectedDate = MOCK_DATETIME.set({ second: 0, millisecond: 0 });
      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        expectedDate.toISO(),
        undefined,
      );
    });

    it('calls handleInputChange with null when the date is cleared', () => {
      let capturedOnChange: (date: DateTime | null) => void = jest.fn();
      mockDateTimePicker.mockImplementation(({ onChange }) => {
        capturedOnChange = onChange;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      act(() => {
        capturedOnChange(null);
      });

      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        null,
        undefined,
      );
    });

    it('includes the form parameter in handleInputChange calls', () => {
      let capturedOnChange: (date: DateTime | null) => void = jest.fn();
      mockDateTimePicker.mockImplementation(({ onChange }) => {
        capturedOnChange = onChange;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(
        <SnapUIDateTimePicker name="test" type="datetime" form="my-form" />,
      );

      act(() => {
        capturedOnChange(MOCK_DATETIME);
      });

      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        MOCK_DATETIME.toISO(),
        'my-form',
      );
    });

    it('updates the internal value after a change', () => {
      let capturedOnChange: (date: DateTime | null) => void = jest.fn();
      const receivedValues: (DateTime | null)[] = [];
      mockDateTimePicker.mockImplementation(({ onChange, value }) => {
        capturedOnChange = onChange;
        receivedValues.push(value);
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      act(() => {
        capturedOnChange(MOCK_DATETIME);
      });

      const lastValue = receivedValues[receivedValues.length - 1];
      expect(lastValue?.toISO()).toBe(MOCK_DATETIME.toISO());
    });
  });
});
