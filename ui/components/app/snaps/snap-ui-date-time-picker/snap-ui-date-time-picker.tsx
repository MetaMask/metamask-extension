import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { Box } from '@metamask/design-system-react';
import classnames from 'clsx';
import { DateTime } from 'luxon';
import { HelpText, HelpTextSeverity, Label } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { useI18nContext } from '../../../../hooks/useI18nContext';

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
 * Buttons rendered in the picker action bar (order: clear → cancel → accept).
 */
const PICKER_ACTION_BAR_ACTIONS: ('clear' | 'cancel' | 'accept' | 'today')[] = [
  'clear',
  'cancel',
  'accept',
];

const readOnlyFieldStyles: React.CSSProperties = {
  width: '100%',
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
  padding: '0 16px',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

type ReadOnlyPickerFieldProps = {
  displayText: string;
  placeholder: string;
  onClick: () => void;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLDivElement>;
  className?: string;
};

/**
 * A minimal read-only field that replaces MUI's built-in date field.
 * This avoids the flash of format-mask characters (dd/mm/yy hh:mm:ss)
 * that the built-in field renders before the dialog opens.
 * @param options0
 * @param options0.displayText
 * @param options0.placeholder
 * @param options0.onClick
 * @param options0.disabled
 * @param options0.inputRef
 * @param options0.className
 */
const ReadOnlyPickerField: React.FC<ReadOnlyPickerFieldProps> = ({
  displayText,
  placeholder,
  onClick,
  disabled,
  inputRef,
  className,
}) => (
  <div
    ref={inputRef}
    role="textbox"
    aria-readonly="true"
    aria-disabled={disabled || undefined}
    tabIndex={disabled ? -1 : 0}
    className={className}
    onClick={disabled ? undefined : onClick}
    onKeyDown={
      disabled
        ? undefined
        : (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }
    }
    style={{
      ...readOnlyFieldStyles,
      opacity: disabled ? 0.5 : 1,
      color: displayText
        ? 'var(--color-text-default)'
        : 'var(--color-text-alternative)',
    }}
  >
    {displayText || placeholder}
  </div>
);

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
  const t = useI18nContext();

  const initialValue = getValue(name, form) as string;

  const hasInitialValue = Boolean(initialValue);

  // The date shown inside the picker dialog (always non-null so the
  // toolbar/calendar never shows dashes). Defaults to "now".
  const [pickerValue, setPickerValue] = React.useState<DateTime>(
    initialValue
      ? DateTime.fromISO(initialValue)
      : (normalizeDate(DateTime.now(), type) as DateTime),
  );

  // Whether the user has committed a selection (or a value was provided).
  const [committed, setCommitted] = React.useState(hasInitialValue);

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setPickerValue(DateTime.fromISO(initialValue));
      setCommitted(true);
    }
  }, [initialValue]);

  const handleChange = (date: DateTime | null) => {
    if (!date) {
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

  const formatDisplay = (d: DateTime): string => {
    switch (type) {
      case 'date':
        return d.toLocaleString(DateTime.DATE_MED);
      case 'time':
        return d.toLocaleString(DateTime.TIME_24_SIMPLE);
      case 'datetime':
      default:
        return `${d.toLocaleString(DateTime.DATE_MED)} ${d.toLocaleString(DateTime.TIME_24_SIMPLE)}`;
    }
  };

  const defaultPlaceholder = (() => {
    switch (type) {
      case 'date':
        return t('selectADate') as string;
      case 'time':
        return t('selectATime') as string;
      case 'datetime':
      default:
        return t('selectADateAndTime') as string;
    }
  })();

  const displayText = committed ? formatDisplay(pickerValue) : '';

  const customFieldSlot = useCallback(
    (params?: { className?: string; ref?: React.Ref<HTMLDivElement> }) => (
      <ReadOnlyPickerField
        displayText={displayText}
        placeholder={placeholder ?? defaultPlaceholder}
        onClick={handleOpen}
        disabled={disabled}
        inputRef={params?.ref}
        className={params?.className}
      />
    ),
    [displayText, placeholder, defaultPlaceholder, handleOpen, disabled],
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
          toolbarTitle=""
          ampm={false}
          renderInput={customFieldSlot}
          componentsProps={{
            actionBar: {
              actions: PICKER_ACTION_BAR_ACTIONS,
            },
          }}
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
          toolbarTitle=""
          renderInput={customFieldSlot}
          componentsProps={{
            actionBar: {
              actions: PICKER_ACTION_BAR_ACTIONS,
            },
          }}
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
          toolbarTitle=""
          renderInput={customFieldSlot}
          componentsProps={{
            actionBar: {
              actions: PICKER_ACTION_BAR_ACTIONS,
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
