import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';
import { SnapUIDateTimePicker } from './snap-ui-date-time-picker';

const mockHandleInputChange = jest.fn();
const mockGetValue = jest.fn().mockReturnValue(null);

jest.mock('../../../../contexts/snaps', () => ({
  useSnapInterfaceContext: () => ({
    handleInputChange: mockHandleInputChange,
    getValue: mockGetValue,
  }),
}));

const MOCK_TODAY = DateTime.fromISO('2026-06-02T21:43:00.000Z');

function renderPicker(
  props: Partial<React.ComponentProps<typeof SnapUIDateTimePicker>> = {},
) {
  return render(
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <SnapUIDateTimePicker name="dt" type="datetime" {...props} />
    </LocalizationProvider>,
  );
}

function openPicker() {
  // { hidden: true } — MUI Modal marks surrounding content aria-hidden while
  // a dialog is open or transitioning out in JSDOM.
  fireEvent.click(screen.getByRole('textbox', { hidden: true }));
}

function clickOk() {
  fireEvent.click(screen.getByRole('button', { name: /ok/iu }));
}

function clickCancel() {
  fireEvent.click(screen.getByRole('button', { name: /cancel/iu }));
}

function clickClear() {
  fireEvent.click(screen.getByRole('button', { name: /clear/iu }));
}

function expectDaySelected(day: number) {
  // MUI sets aria-selected="true" on the day button (non-standard for role=button),
  // so we use a direct DOM query rather than testing-library's { selected } option.
  const dialog = screen.getByRole('dialog');
  const selectedEl = dialog.querySelector('[aria-selected="true"]');
  expect(selectedEl).not.toBeNull();
  expect(selectedEl?.textContent?.trim()).toBe(String(day));
}

describe('SnapUIDateTimePicker', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetValue.mockReturnValue(null);
    jest.spyOn(DateTime, 'now').mockReturnValue(MOCK_TODAY);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders all picker variants, label, and error', () => {
      const { getByRole, rerender, getByText } = renderPicker({
        type: 'datetime',
      });
      expect(getByRole('textbox')).toBeInTheDocument();

      rerender(
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <SnapUIDateTimePicker name="dt" type="date" />
        </LocalizationProvider>,
      );
      expect(getByRole('textbox')).toBeInTheDocument();

      rerender(
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <SnapUIDateTimePicker name="dt" type="time" />
        </LocalizationProvider>,
      );
      expect(getByRole('textbox')).toBeInTheDocument();

      rerender(
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <SnapUIDateTimePicker
            name="dt"
            type="datetime"
            label="Pick a date"
            error="Something went wrong"
          />
        </LocalizationProvider>,
      );
      expect(getByText('Pick a date')).toBeInTheDocument();
      expect(getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('functionality', () => {
    it('open and click OK without interaction → today is highlighted, committed, and shown in input', () => {
      renderPicker({ type: 'date' });

      act(() => openPicker());

      // Input stays empty while the dialog is open
      expect(screen.getByRole('textbox', { hidden: true })).toHaveValue('');
      expectDaySelected(2);

      act(() => clickOk());

      expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
      const [, iso] = mockHandleInputChange.mock.calls[0];
      expect(iso).toMatch(/2026-06-02/u);
      expect(screen.getByRole('textbox', { hidden: true })).toHaveValue(
        '06/02/2026',
      );
    });

    it('open, select a date, click OK → commits the selected date', () => {
      renderPicker({ type: 'date' });

      act(() => openPicker());
      act(() => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('gridcell', {
            name: '5',
          }),
        );
        clickOk();
      });

      expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
      const [, iso] = mockHandleInputChange.mock.calls[0];
      expect(iso).toMatch(/2026-06-05/u);
    });

    it('open, cancel → no value written', () => {
      renderPicker({ type: 'datetime' });

      act(() => openPicker());
      act(() => clickCancel());

      expect(mockHandleInputChange).not.toHaveBeenCalled();
    });

    it('set value, open, clear → clears to null immediately', () => {
      mockGetValue.mockReturnValue('2026-03-05T14:30:00.000Z');
      renderPicker({ type: 'datetime' });

      act(() => openPicker());
      act(() => clickClear());

      expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
      const [, iso] = mockHandleInputChange.mock.calls[0];
      expect(iso).toBeNull();
    });

    it('set value → input shows formatted date', () => {
      mockGetValue.mockReturnValue('2026-03-05T14:30:00.000Z');
      renderPicker({ type: 'date' });

      expect(screen.getByRole('textbox')).toHaveValue('03/05/2026');
    });

    it('open → select → cancel → open → cancel → open → today is still highlighted', () => {
      renderPicker({ type: 'date' });

      act(() => openPicker());
      act(() => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('gridcell', {
            name: '5',
          }),
        );
        clickCancel();
      });

      act(() => openPicker());
      act(() => clickCancel());

      act(() => openPicker());
      expectDaySelected(2);

      act(() => clickOk());
      const [, iso] = mockHandleInputChange.mock.calls[0];
      expect(iso).toMatch(/2026-06-02/u);
      expect(screen.getByRole('textbox', { hidden: true })).toHaveValue(
        '06/02/2026',
      );
    });
  });
});
