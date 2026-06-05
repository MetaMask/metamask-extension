import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
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
 * MUI action-bar action keys (order: clear → cancel → accept).
 * Button labels are localized via `LocalizationProvider` in `snap-ui-renderer`.
 */
const PICKER_ACTION_BAR_ACTIONS = ['clear', 'cancel', 'accept'] as const;

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
      return date.set({ second: 0, millisecond: 0 });
  }
}

/**
 * Parses interface state into a committed DateTime, or null when unset/invalid.
 * getValue can return an empty string; that must not be treated as a valid ISO value.
 * @param value
 * @param type
 */
function parseInitialIsoValue(
  value: string | undefined | null,
  type: 'date' | 'time' | 'datetime',
): DateTime | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = DateTime.fromISO(value);
  if (!parsed.isValid) {
    return null;
  }
  return normalizeDate(parsed, type) as DateTime;
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
  placeholder,
  name,
  form,
  disabled,
  error,
  disablePast = false,
  disableFuture = false,
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();
  const initialValue = getValue(name, form) as string | undefined | null;
  const parsedInitialValue = parseInitialIsoValue(initialValue, type);
  const hasInitialValue = parsedInitialValue !== null;

  // The date shown inside the picker dialog (always non-null so the
  // toolbar/calendar never shows dashes). Defaults to "now".
  const [pickerValue, setPickerValue] = React.useState<DateTime>(
    parsedInitialValue ?? (normalizeDate(DateTime.now(), type) as DateTime),
  );

  // Whether the user has committed a selection (or a value was provided).
  const [committed, setCommitted] = React.useState(hasInitialValue);

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    const parsed = parseInitialIsoValue(initialValue, type);
    if (parsed) {
      setPickerValue(parsed);
      setCommitted(true);
      return;
    }
    setCommitted(false);
    setPickerValue(normalizeDate(DateTime.now(), type) as DateTime);
  }, [initialValue, type]);

  const handleChange = (date: DateTime | null) => {
    if (!date) {
      setCommitted(false);
      handleInputChange(name, null, form);
      setPickerValue(normalizeDate(DateTime.now(), type) as DateTime);
      return;
    }
    setPickerValue(normalizeDate(date, type) as DateTime);
  };

  const handleAccept = (date: DateTime | null) => {
    if (!date) {
      setCommitted(false);
      handleInputChange(name, null, form);
      return;
    }
    const normalizedDate = normalizeDate(date, type) as DateTime;
    setPickerValue(normalizedDate);
    setCommitted(true);
    handleInputChange(name, normalizedDate.toISO(), form);
  };

  const handleOpen = useCallback(() => {
    // Refresh "now" each time the dialog opens when nothing is committed yet
    if (!committed) {
      setPickerValue(normalizeDate(DateTime.now(), type) as DateTime);
    }
    setOpen(true);
  }, [committed, type]);
  const handleClose = useCallback(() => setOpen(false), []);

  const pickerSlotProps = useMemo(
    () => ({
      textField: {
        inputProps: {
          placeholder,
          readOnly: true,
          ...(committed ? {} : { value: '' }),
        },
        InputProps: {
          disableUnderline: true,
          sx: {
            fontFamily: 'var(--font-family-default)',
            backgroundColor: 'var(--color-background-default)',
            border: '1px solid var(--color-border-muted)',
            color: 'var(--color-text-default)',
            maxHeight: '58px',
            minHeight: '48px',
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '8px',
            fontSize: 'var(--typography-s-body-md-font-size)',
            '& > input': {
              padding: '0 16px',
            },
          },
        },
        variant: 'standard' as const,
        fullWidth: true,
      },
      actionBar: {
        actions: [...PICKER_ACTION_BAR_ACTIONS],
      },
    }),
    [placeholder, committed],
  );

  return (
    <Box
      className={classnames('snap-ui-renderer__date-time-picker', {
        'snap-ui-renderer__field': label !== undefined,
      })}
    >
      {label && <Label htmlFor={name}>{label}</Label>}
      {type === 'datetime' && (
        <MobileDateTimePicker
          className="snap-ui-renderer__date-time-picker--datetime"
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          value={pickerValue}
          onChange={handleChange}
          onAccept={handleAccept}
          disabled={disabled}
          disablePast={disablePast}
          disableFuture={disableFuture}
          localeText={{ toolbarTitle: '' }}
          ampm={false}
          slotProps={pickerSlotProps}
        />
      )}
      {type === 'date' && (
        <MobileDatePicker
          className="snap-ui-renderer__date-time-picker--date"
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          value={pickerValue}
          onChange={handleChange}
          onAccept={handleAccept}
          disabled={disabled}
          disablePast={disablePast}
          disableFuture={disableFuture}
          localeText={{ toolbarTitle: '' }}
          slotProps={pickerSlotProps}
        />
      )}
      {type === 'time' && (
        <MobileTimePicker
          className="snap-ui-renderer__date-time-picker--time"
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          value={pickerValue}
          onChange={handleChange}
          onAccept={handleAccept}
          disabled={disabled}
          ampm={false}
          localeText={{ toolbarTitle: '' }}
          slotProps={pickerSlotProps}
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
