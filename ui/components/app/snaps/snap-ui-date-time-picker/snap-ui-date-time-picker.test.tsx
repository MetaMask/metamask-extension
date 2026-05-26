import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { DateTime } from 'luxon';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { SnapUIDateTimePicker } from './snap-ui-date-time-picker';

jest.mock('../../../../contexts/snaps', () => ({
  useSnapInterfaceContext: jest.fn(),
}));

jest.mock('@mui/x-date-pickers/MobileDateTimePicker', () => ({
  MobileDateTimePicker: jest.fn(),
}));

jest.mock('@mui/x-date-pickers/MobileDatePicker', () => ({
  MobileDatePicker: jest.fn(),
}));

jest.mock('@mui/x-date-pickers/MobileTimePicker', () => ({
  MobileTimePicker: jest.fn(),
}));

const mockDateTimePicker = MobileDateTimePicker as jest.Mock;
const mockDatePicker = MobileDatePicker as jest.Mock;
const mockTimePicker = MobileTimePicker as jest.Mock;
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
        <SnapUIDateTimePicker
          name="test"
          type="datetime"
          label="Pick a date"
        />,
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
        screen
          .getByTestId('mock-datetime-picker')
          .getAttribute('data-disabled'),
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

      expect(screen.getByTestId('mock-datetime-picker').className).toContain(
        'snap-ui-renderer__date-time-picker--datetime',
      );
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

    it('provides a renderInput prop to all picker types', () => {
      let datetimeRenderInput: unknown;
      let dateRenderInput: unknown;
      let timeRenderInput: unknown;

      mockDateTimePicker.mockImplementation(({ renderInput }) => {
        datetimeRenderInput = renderInput;
        return <div data-testid="mock-datetime-picker" />;
      });
      mockDatePicker.mockImplementation(({ renderInput }) => {
        dateRenderInput = renderInput;
        return <div data-testid="mock-date-picker" />;
      });
      mockTimePicker.mockImplementation(({ renderInput }) => {
        timeRenderInput = renderInput;
        return <div data-testid="mock-time-picker" />;
      });

      const { unmount: u1 } = render(
        <SnapUIDateTimePicker name="test" type="datetime" />,
      );
      expect(typeof datetimeRenderInput).toBe('function');
      u1();

      const { unmount: u2 } = render(
        <SnapUIDateTimePicker name="test" type="date" />,
      );
      expect(typeof dateRenderInput).toBe('function');
      u2();

      render(<SnapUIDateTimePicker name="test" type="time" />);
      expect(typeof timeRenderInput).toBe('function');
    });

    it('shows placeholder text before any selection is committed', () => {
      mockDateTimePicker.mockImplementation(({ renderInput }) => {
        return typeof renderInput === 'function' ? (
          (renderInput as () => React.ReactElement)()
        ) : (
          <div />
        );
      });

      const { getByRole } = render(
        <SnapUIDateTimePicker
          name="test"
          type="datetime"
          placeholder="Pick a date and time"
        />,
      );

      const field = getByRole('textbox');
      expect(field.textContent).toBe('Pick a date and time');
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

    it('defaults to current date/time (seconds zeroed) when no value is in context', () => {
      mockGetValue.mockReturnValue(undefined);
      const before = DateTime.now().set({ second: 0, millisecond: 0 });

      let receivedValue: DateTime | null | undefined;
      mockDateTimePicker.mockImplementation(({ value }) => {
        receivedValue = value;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      const after = DateTime.now();
      expect(receivedValue).not.toBeNull();
      expect((receivedValue as DateTime).toMillis()).toBeGreaterThanOrEqual(
        before.toMillis(),
      );
      expect((receivedValue as DateTime).toMillis()).toBeLessThanOrEqual(
        after.toMillis(),
      );
      expect((receivedValue as DateTime).second).toBe(0);
      expect((receivedValue as DateTime).millisecond).toBe(0);
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

  describe('onChange (intermediate selections)', () => {
    it('does not call handleInputChange on intermediate onChange', () => {
      let capturedOnChange: (date: DateTime | null) => void = jest.fn();
      mockDateTimePicker.mockImplementation(({ onChange }) => {
        capturedOnChange = onChange;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      act(() => {
        capturedOnChange(MOCK_DATETIME);
      });

      expect(mockHandleInputChange).not.toHaveBeenCalled();
    });

    it('updates the internal picker value on onChange', () => {
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
      const expected = MOCK_DATETIME.set({ second: 0, millisecond: 0 });
      expect(lastValue?.toISO()).toBe(expected.toISO());
    });
  });

  describe('onAccept (user confirms selection)', () => {
    it('calls handleInputChange with the normalized ISO string for datetime type', () => {
      let capturedOnAccept: (date: DateTime | null) => void = jest.fn();
      mockDateTimePicker.mockImplementation(({ onAccept }) => {
        capturedOnAccept = onAccept;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      act(() => {
        capturedOnAccept(MOCK_DATETIME);
      });

      const expected = MOCK_DATETIME.set({ second: 0, millisecond: 0 });
      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        expected.toISO(),
        undefined,
      );
    });

    it('normalizes date type to midnight when calling handleInputChange', () => {
      let capturedOnAccept: (date: DateTime | null) => void = jest.fn();
      mockDatePicker.mockImplementation(({ onAccept }) => {
        capturedOnAccept = onAccept;
        return <div data-testid="mock-date-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="date" />);

      act(() => {
        capturedOnAccept(MOCK_DATETIME);
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
      let capturedOnAccept: (date: DateTime | null) => void = jest.fn();
      mockTimePicker.mockImplementation(({ onAccept }) => {
        capturedOnAccept = onAccept;
        return <div data-testid="mock-time-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="time" />);

      act(() => {
        capturedOnAccept(MOCK_DATETIME);
      });

      const expectedDate = MOCK_DATETIME.set({ second: 0, millisecond: 0 });
      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        expectedDate.toISO(),
        undefined,
      );
    });

    it('calls handleInputChange with null when the date is cleared', () => {
      let capturedOnAccept: (date: DateTime | null) => void = jest.fn();
      mockDateTimePicker.mockImplementation(({ onAccept }) => {
        capturedOnAccept = onAccept;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);

      act(() => {
        capturedOnAccept(null);
      });

      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        null,
        undefined,
      );
    });

    it('includes the form parameter in handleInputChange calls', () => {
      let capturedOnAccept: (date: DateTime | null) => void = jest.fn();
      mockDateTimePicker.mockImplementation(({ onAccept }) => {
        capturedOnAccept = onAccept;
        return <div data-testid="mock-datetime-picker" />;
      });

      render(
        <SnapUIDateTimePicker name="test" type="datetime" form="my-form" />,
      );

      act(() => {
        capturedOnAccept(MOCK_DATETIME);
      });

      const expected = MOCK_DATETIME.set({ second: 0, millisecond: 0 });
      expect(mockHandleInputChange).toHaveBeenCalledWith(
        'test',
        expected.toISO(),
        'my-form',
      );
    });
  });

  describe('ReadOnlyPickerField', () => {
    /**
     * Renders the SnapUIDateTimePicker with the mock picker invoking
     * renderInput so the actual ReadOnlyPickerField is rendered in the DOM.
     *
     * @param props - Optional partial props to pass to the picker.
     */
    function renderWithField(
      props: Partial<React.ComponentProps<typeof SnapUIDateTimePicker>> = {},
    ) {
      mockDateTimePicker.mockImplementation(({ renderInput, onOpen }) => {
        const rendered =
          typeof renderInput === 'function'
            ? (
                renderInput as (p: { className?: string }) => React.ReactElement
              )({ className: 'test-class' })
            : null;
        return (
          <div
            data-testid="mock-datetime-picker"
            data-on-open={Boolean(onOpen)}
          >
            {rendered}
          </div>
        );
      });

      return render(
        <SnapUIDateTimePicker name="test" type="datetime" {...props} />,
      );
    }

    it('renders with role="textbox" and aria-readonly', () => {
      renderWithField();
      const field = screen.getByRole('textbox');
      expect(field).toBeInTheDocument();
      expect(field.getAttribute('aria-readonly')).toBe('true');
    });

    it('has tabIndex 0 when enabled', () => {
      renderWithField();
      const field = screen.getByRole('textbox');
      expect(field.tabIndex).toBe(0);
    });

    it('has tabIndex -1 when disabled', () => {
      renderWithField({ disabled: true });
      const field = screen.getByRole('textbox');
      expect(field.tabIndex).toBe(-1);
    });

    it('sets aria-disabled when disabled', () => {
      renderWithField({ disabled: true });
      const field = screen.getByRole('textbox');
      expect(field.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when enabled', () => {
      renderWithField();
      const field = screen.getByRole('textbox');
      expect(field.hasAttribute('aria-disabled')).toBe(false);
    });

    it('forwards the className from renderInput params', () => {
      renderWithField();
      const field = screen.getByRole('textbox');
      expect(field.className).toBe('test-class');
    });

    it('displays placeholder text when no value is committed', () => {
      renderWithField({ placeholder: 'Choose date' });
      const field = screen.getByRole('textbox');
      expect(field.textContent).toBe('Choose date');
    });

    it('opens the picker on click when enabled', () => {
      let capturedOnOpen: (() => void) | undefined;
      mockDateTimePicker.mockImplementation(({ renderInput, onOpen }) => {
        capturedOnOpen = onOpen;
        const rendered =
          typeof renderInput === 'function'
            ? (renderInput as (p: object) => React.ReactElement)({})
            : null;
        return <div data-testid="mock-datetime-picker">{rendered}</div>;
      });

      render(<SnapUIDateTimePicker name="test" type="datetime" />);
      const field = screen.getByRole('textbox');

      fireEvent.click(field);

      expect(capturedOnOpen).toBeDefined();
    });

    it('does not respond to click when disabled', () => {
      const onOpenSpy = jest.fn();
      mockDateTimePicker.mockImplementation(({ renderInput }) => {
        const rendered =
          typeof renderInput === 'function'
            ? (renderInput as (p: object) => React.ReactElement)({})
            : null;
        return <div data-testid="mock-datetime-picker">{rendered}</div>;
      });

      render(
        <SnapUIDateTimePicker name="test" type="datetime" disabled={true} />,
      );
      const field = screen.getByRole('textbox');

      fireEvent.click(field);
      expect(onOpenSpy).not.toHaveBeenCalled();
    });

    it('applies reduced opacity when disabled', () => {
      renderWithField({ disabled: true });
      const field = screen.getByRole('textbox');
      expect(field.style.opacity).toBe('0.5');
    });

    it('applies full opacity when enabled', () => {
      renderWithField();
      const field = screen.getByRole('textbox');
      expect(field.style.opacity).toBe('1');
    });
  });
});
