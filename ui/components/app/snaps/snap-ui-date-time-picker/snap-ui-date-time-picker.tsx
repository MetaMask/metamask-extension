import React, { FunctionComponent, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Box } from '@metamask/design-system-react';
import classnames from 'clsx';
import { DateTime } from 'luxon';
import { HelpText, HelpTextSeverity, Label } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

/**
 * The props for the SnapUIDateTimePicker component.
 */
export type SnapUIDateTimePickerProps = {
  name: string;
  type: 'date' | 'time' | 'datetime';
  label?: string;
  error?: string;
  placeholder?: string;
  form?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
  disabled?: boolean;
};

/**
 * Shared sx styles for the date/time picker input field.
 */
const pickerInputSx = {
  width: '100%',
  '& .MuiInputBase-root': {
    fontFamily: 'var(--font-family-default)',
    backgroundColor: 'var(--color-background-default)',
    border: '1px solid var(--color-border-muted)',
    color: 'var(--color-text-default)',
    height: '100%',
    maxHeight: '58px',
    minHeight: '48px',
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '8px',
    fontSize: 'var(--typography-s-body-md-font-size)',
  },
  '& .MuiInputBase-root input': {
    padding: '0 16px',
  },
};

/**
 * Normalizes the date based on the picker type.
 *
 * @param date - The date to normalize.
 * @param type - The type of the picker (date, time, datetime).
 * @returns The normalized date.
 */
function normalizeDate(
  date: DateTime | null,
  type: 'date' | 'time' | 'datetime',
): DateTime | null {
  if (!date) {
    return null;
  }
  switch (type) {
    case 'date':
      return date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    case 'time':
      return date.set({ second: 0, millisecond: 0 });
    case 'datetime':
    default:
      return date;
  }
}

/**
 * The SnapUIDateTimePicker component.
 *
 * @param props - The component props.
 * @param props.name - The name of the input.
 * @param props.type - The type of the picker (date, time, datetime).
 * @param props.label - The label for the picker.
 * @param props.form - The form identifier.
 * @param props.disabled - Whether the picker is disabled.
 * @param props.error - The error message to display.
 * @param props.disablePast - Whether to disable past dates (only for date and datetime types).
 * @param props.disableFuture - Whether to disable future dates (only for date and datetime types).
 * @param props.placeholder - The placeholder text for the picker.
 * @returns The DateTimePicker component.
 */
export const SnapUIDateTimePicker: FunctionComponent<
  SnapUIDateTimePickerProps
> = ({
  type = 'datetime',
  label,
  placeholder = '',
  name,
  form,
  disabled,
  error,
  disablePast = false,
  disableFuture = false,
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = React.useState<DateTime | null>(
    initialValue ? DateTime.fromISO(initialValue) : null,
  );

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setValue(DateTime.fromISO(initialValue));
    }
  }, [initialValue]);

  const handleChange = (date: DateTime | null) => {
    const normalizedDate = normalizeDate(date, type);

    const isoString = normalizedDate ? normalizedDate.toISO() : null;

    setValue(normalizedDate);
    handleInputChange(name, isoString, form);
  };

  return (
    <Box
      className={classnames('snap-ui-renderer__date-time-picker', {
        'snap-ui-renderer__field': label !== undefined,
      })}
    >
      {label && <Label htmlFor={name}>{label}</Label>}
      {type === 'datetime' && (
        <DateTimePicker
          className="snap-ui-renderer__date-time-picker--datetime"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          disablePast={disablePast}
          disableFuture={disableFuture}
          format={'D T'}
          ampm={false}
          slotProps={{
            textField: {
              placeholder,
              variant: 'standard',
              InputProps: { disableUnderline: true },
              sx: pickerInputSx,
            },
            actionBar: {
              actions: ['clear', 'cancel', 'accept'],
            },
          }}
        />
      )}
      {type === 'date' && (
        <DatePicker
          className="snap-ui-renderer__date-time-picker--date"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          disablePast={disablePast}
          disableFuture={disableFuture}
          format={'D'}
          slotProps={{
            textField: {
              placeholder,
              variant: 'standard',
              InputProps: { disableUnderline: true },
              sx: pickerInputSx,
            },
            actionBar: {
              actions: ['clear', 'cancel', 'accept'],
            },
          }}
        />
      )}
      {type === 'time' && (
        <TimePicker
          className="snap-ui-renderer__date-time-picker--time"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          ampm={false}
          slotProps={{
            textField: {
              placeholder,
              variant: 'standard',
              InputProps: { disableUnderline: true },
              sx: pickerInputSx,
            },
            actionBar: {
              actions: ['clear', 'cancel', 'accept'],
            },
          }}
        />
      )}
      {error && (
        <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
          {error}
        </HelpText>
      )}
    </Box>
  );
};
