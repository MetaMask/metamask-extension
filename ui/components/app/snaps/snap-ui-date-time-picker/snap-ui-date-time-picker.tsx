import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  if (type === 'date') {
    return date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  }
  return date.set({ second: 0, millisecond: 0 });
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
  if (!value) {
    return null;
  }
  const parsed = DateTime.fromISO(value);
  return parsed.isValid ? (normalizeDate(parsed, type) as DateTime) : null;
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
  const initialParsed = parseInitialIsoValue(initialValue, type);

  // null = no committed value (shows placeholder); non-null = committed value.
  const [value, setValue] = React.useState<DateTime | null>(initialParsed);

  // Snapshot of value at the moment the picker opens, so handleClose can
  // discard any draft regardless of whether onAccept fired.
  const valueAtOpenRef = useRef<DateTime | null>(initialParsed);

  const [open, setOpen] = React.useState(false);

  // Sync local state when the Snap interface updates this field externally.
  useEffect(() => {
    const parsed = parseInitialIsoValue(initialValue, type);
    setValue(parsed);
    valueAtOpenRef.current = parsed;
  }, [initialValue, type]);

  // Capture the current committed value as the snapshot before opening.
  const handleOpen = useCallback(() => {
    valueAtOpenRef.current = value;
    setOpen(true);
  }, [value]);

  // Fires on OK (date) or Clear (date === null). The only place we write to
  // the Snap interface. Also advances the snapshot so handleClose is a no-op.
  const handleAccept = useCallback(
    (date: DateTime | null) => {
      const normalized = normalizeDate(date, type) as DateTime | null;
      setValue(normalized);
      valueAtOpenRef.current = normalized;
      handleInputChange(name, normalized?.toISO() ?? null, form);
    },
    [handleInputChange, name, form, type],
  );

  // Discard any draft on cancel, backdrop tap, or Escape.
  // After accept this is a no-op since handleAccept already advanced the snapshot.
  const handleClose = useCallback(() => {
    setOpen(false);
    setValue(valueAtOpenRef.current);
  }, []);

  const pickerSlotProps = useMemo(
    () => ({
      textField: {
        inputProps: {
          placeholder,
          readOnly: true,
          // Force empty display when no value is committed so the placeholder
          // shows instead of MUI rendering dashes for a null value.
          ...(value === null ? { value: '' } : {}),
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
              // Prevent the input from receiving focus so MUI v7 cannot apply
              // section-highlighting on this read-only display trigger.
              pointerEvents: 'none',
            },
          },
        },
        variant: 'standard' as const,
        fullWidth: true,
      },
      actionBar: { actions: [...PICKER_ACTION_BAR_ACTIONS] },
    }),
    [placeholder, value],
  );

  // When no value is committed, default the picker dialog to today so the
  // calendar opens with a date highlighted rather than showing dashes.
  const today = normalizeDate(DateTime.now(), type) as DateTime;

  const sharedPickerProps = {
    open,
    onOpen: handleOpen,
    onClose: handleClose,
    value: value ?? today,
    onAccept: handleAccept,
    disabled,
    slotProps: pickerSlotProps,
  };

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
          {...sharedPickerProps}
          disablePast={disablePast}
          disableFuture={disableFuture}
          localeText={{ toolbarTitle: '' }}
          ampm={false}
        />
      )}
      {type === 'date' && (
        <MobileDatePicker
          className="snap-ui-renderer__date-time-picker--date"
          {...sharedPickerProps}
          disablePast={disablePast}
          disableFuture={disableFuture}
          localeText={{ toolbarTitle: '' }}
        />
      )}
      {type === 'time' && (
        <MobileTimePicker
          className="snap-ui-renderer__date-time-picker--time"
          {...sharedPickerProps}
          ampm={false}
          localeText={{ toolbarTitle: '' }}
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
