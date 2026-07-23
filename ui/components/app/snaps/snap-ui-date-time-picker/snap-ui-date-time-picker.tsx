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
import { PickersActionBar } from '@mui/x-date-pickers/PickersActionBar';
import type { PickersActionBarProps } from '@mui/x-date-pickers/PickersActionBar';
import { Box } from '@metamask/design-system-react';
import classnames from 'clsx';
import { DateTime } from 'luxon';
import { HelpText, HelpTextSeverity, Label } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

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

// MUI action identifiers — not display text. MUI resolves these to translated
// labels via the localeText passed to LocalizationProvider in snap-ui-renderer.
const PICKER_ACTION_BAR_ACTIONS = ['clear', 'cancel', 'accept'] as const;

/**
 * Normalizes the date based on the picker type.
 *
 * @param date - The date to normalize.
 * @param type - The type of the picker.
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
 * Parses a raw interface value (ISO string, empty string, null, or undefined)
 * into a normalized DateTime, or null when unset/invalid.
 *
 * @param value - The raw value from the Snap interface.
 * @param type - The type of the picker.
 * @returns The parsed and normalized DateTime, or null.
 */
function parseInitialIsoValue(
  value: string | undefined | null,
  type: 'date' | 'time' | 'datetime',
): DateTime | null {
  if (value === undefined || value === null || value === '') {
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

  const [value, setValue] = React.useState<DateTime | null>(() =>
    parseInitialIsoValue(initialValue, type),
  );

  useEffect(() => {
    const parsed = parseInitialIsoValue(initialValue, type);
    if (parsed !== null) {
      setValue(parsed);
    }
  }, [initialValue, type]);

  const draftRef = useRef<DateTime | null>(null);

  // Re-assigned each render so the stable CustomActionBar reads current state.
  const actionsRef = useRef({
    commit: () => undefined as void,
    clear: () => undefined as void,
  });
  actionsRef.current = {
    commit: () => {
      const toCommit = normalizeDate(
        draftRef.current ?? value ?? DateTime.now(),
        type,
      ) as DateTime;
      setValue(toCommit);
      handleInputChange(name, toCommit.toISO(), form);
    },
    clear: () => {
      if (value === null) {
        return;
      }
      setValue(null);
      handleInputChange(name, null, form);
    },
  };

  // Created once so MUI never remounts the action bar. MUI v7 does not fire
  // onAccept when OK is pressed without changing the value, so we intercept it.
  const CustomActionBar = useMemo(
    () =>
      function customActionBar(props: PickersActionBarProps) {
        return (
          <PickersActionBar
            {...props}
            onAccept={() => {
              actionsRef.current.commit();
              props.onAccept();
            }}
            onClear={() => {
              actionsRef.current.clear();
              props.onClear();
            }}
          />
        );
      },
    [],
  );

  const handleChange = useCallback((date: DateTime | null) => {
    draftRef.current = date;
  }, []);

  const handleOpen = useCallback(() => {
    draftRef.current = value;
  }, [value]);

  const pickerSlotProps = useMemo(
    () => ({
      textField: {
        inputProps: {
          placeholder,
          readOnly: true,
          onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.blur(),
          // Show the placeholder when empty — key must be absent (not undefined)
          // when a value is committed so MUI's controlled rendering takes effect.
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

  // value ?? today ensures today is highlighted in the calendar when the field
  // is empty; inputProps.value = '' keeps the textbox showing the placeholder.
  const today = normalizeDate(DateTime.now(), type) as DateTime;
  const pickerValue = value ?? today;

  const sharedPickerProps = {
    value: pickerValue,
    onChange: handleChange,
    onOpen: handleOpen,
    disabled,
    slotProps: pickerSlotProps,
    slots: { actionBar: CustomActionBar },
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
