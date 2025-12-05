import React, { FunctionComponent, useEffect } from 'react';
import { DatePicker, DateTimePicker, TimePicker } from '@material-ui/pickers';
import { Box } from '@metamask/design-system-react';
import classnames from 'classnames';
import { DateTime } from 'luxon';
import { makeStyles } from '@material-ui/core/styles';
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
 * Styles for the SnapUIDateTimePicker component.
 */
const useStyle = makeStyles({
  root: {
    width: '100%',
  },
  input: {
    fontFamily: 'var(--font-family-default)',
    backgroundColor: 'var(--color-background-default)',
    border: '1px solid var(--color-border-muted)',
    color: 'var(--color-text-default)',
    height: '100%',
    maxHeight: '58px',
    minHeight: '48px',
    display: 'inline-flex',
    alignItems: 'center',
    '&$inputFocused': {
      border: '1px solid var(--color-primary-default)',
    },
    borderRadius: '8px',
    fontSize: 'var(--typography-s-body-md-font-size)',
    '& > input': {
      padding: '0 16px',
    },
  },
});

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
  const t = useI18nContext();
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = React.useState<DateTime | null>(
    initialValue ? DateTime.fromISO(initialValue) : null,
  );

  const classes = useStyle();

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setValue(DateTime.fromISO(initialValue));
    }
  }, [initialValue]);

  const handleChange = (date: DateTime | null) => {
    // Prevent submitting invalid dates
    if (date && !date.isValid) {
      return;
    }

    const isoString = date
      ? date
          // Ensure seconds and milliseconds are zeroed for consistency
          .set({
            second: 0,
            millisecond: 0,
          })
          .toISO()
      : null;

    setValue(date);
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
          className={classnames(
            classes.root,
            'snap-ui-renderer__date-time-picker--datetime',
          )}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          disablePast={disablePast}
          disableFuture={disableFuture}
          placeholder={placeholder}
          clearable
          InputProps={{ disableUnderline: true, className: classes.input }}
          format={'D T'}
          clearLabel={t('clear')}
          cancelLabel={t('cancel')}
          okLabel={t('ok').toUpperCase()}
          ampm={false}
        />
      )}
      {type === 'date' && (
        <DatePicker
          className={classnames(
            classes.root,
            'snap-ui-renderer__date-time-picker--date',
          )}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          disablePast={disablePast}
          disableFuture={disableFuture}
          InputProps={{ disableUnderline: true, className: classes.input }}
          clearable
          placeholder={placeholder}
          format={'D'}
          clearLabel={t('clear')}
          cancelLabel={t('cancel')}
          okLabel={t('ok').toUpperCase()}
        />
      )}
      {type === 'time' && (
        <TimePicker
          className={classnames(
            classes.root,
            'snap-ui-renderer__date-time-picker--time',
          )}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          InputProps={{ disableUnderline: true, className: classes.input }}
          clearable
          placeholder={placeholder}
          clearLabel={t('clear')}
          cancelLabel={t('cancel')}
          okLabel={t('ok').toUpperCase()}
          ampm={false}
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
