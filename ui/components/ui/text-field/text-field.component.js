import React from 'react';
import PropTypes from 'prop-types';
import MaterialTextField from '@mui/material/TextField';

/**
 * @deprecated The `<TextField />` component has been deprecated in favor of the new `<TextField>` component from the component-library.
 * Please update your code to use the new `<TextField>` component instead, which can be found at ui/components/component-library/text-field/text-field.js.
 * You can find documentation for the new `TextField` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-textfield--docs}
 * If you would like to help with the replacement of the old `TextField` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20483}
 */

const inputLabelBase = {
  transform: 'none',
  transition: 'none',
  position: 'initial',
  color: 'var(--color-text-default)',
};

const fontFamily = ['"Geist"', 'Helvetica', 'Arial', 'sans-serif'].join(', ');

const getMaterialThemeInputProps = ({
  dir,
  startAdornment,
  endAdornment,
  min,
  max,
  autoComplete,
}) => ({
  variant: 'standard',
  InputLabelProps: {
    sx: {
      '&.Mui-focused': {
        color: 'var(--color-text-alternative)',
      },
      '&.Mui-error': {
        color: 'var(--color-text-alternative)',
      },
      fontWeight: '400',
      color: 'var(--color-text-alternative)',
    },
  },
  InputProps: {
    startAdornment,
    endAdornment,
    sx: {
      '&:before': {
        borderBottom: '1px solid var(--color-text-default) !important', // Visible bottom border
      },
      '&:after': {
        borderBottom: `2px solid var(--color-primary-default)`, // Animated bottom border
      },
    },
    inputProps: {
      dir,
      min,
      max,
      autoComplete,
    },
  },
});

const getMaterialWhitePaddedThemeInputProps = ({
  dir,
  startAdornment,
  endAdornment,
  min,
  max,
  autoComplete,
}) => ({
  variant: 'standard',
  InputProps: {
    startAdornment,
    endAdornment,
    sx: {
      color: 'var(--color-text-alternative)',
      '&.Mui-focused': {
        color: 'var(--color-background-default)',
      },
      '& .MuiInputBase-input': {
        padding: '8px',
        '&::placeholder': {
          color: 'var(--color-text-alternative)',
        },
      },
      '&:after': {
        borderBottom: '2px solid var(--color-background-default)', // @TODO: Replace with border-muted ?
      },
    },
    inputProps: {
      dir,
      min,
      max,
      autoComplete,
    },
  },
});

const getBorderedThemeInputProps = ({
  dir,
  largeLabel,
  startAdornment,
  endAdornment,
  min,
  max,
  autoComplete,
}) => ({
  InputLabelProps: {
    shrink: true,
    sx: {
      ...(largeLabel ? { fontSize: '1rem' } : { fontSize: '.75rem' }),
      ...inputLabelBase,
      fontFamily,
      '&.Mui-focused': {
        color: 'var(--color-text-alternative)',
      },
      '&.Mui-error': {
        color: 'var(--color-text-alternative)',
      },
    },
  },
  variant: 'standard',
  InputProps: {
    startAdornment,
    endAdornment,
    sx: {
      fontFamily,
      'label + &': {
        marginTop: '9px',
      },
      backgroundColor: 'var(--color-background-default)',
      border: '1px solid var(--color-border-default)',
      color: 'var(--color-text-default)',
      height: '48px',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      '&.Mui-focused': {
        border: '1px solid var(--color-primary-default)',
      },
      borderRadius: '8px',
      fontSize: '0.875rem',
    },
    inputProps: {
      dir,
      min,
      max,
      autoComplete,
    },
    disableUnderline: true,
  },
});

const themeToInputProps = {
  material: getMaterialThemeInputProps,
  bordered: getBorderedThemeInputProps,
  'material-white-padded': getMaterialWhitePaddedThemeInputProps,
};

const TextField = ({
  'data-testid': dataTestId,
  error,
  theme,
  startAdornment,
  endAdornment,
  largeLabel,
  dir,
  min,
  max,
  autoComplete,
  onPaste,
  ...textFieldProps
}) => {
  const inputProps = themeToInputProps[theme]({
    startAdornment,
    endAdornment,
    largeLabel,
    dir,
    min,
    max,
    autoComplete,
  });

  if (onPaste || dataTestId) {
    if (!inputProps.InputProps) {
      inputProps.InputProps = {};
    }
    if (!inputProps.InputProps.inputProps) {
      inputProps.InputProps.inputProps = {};
    }
    inputProps.InputProps.inputProps.onPaste = onPaste;
    inputProps.InputProps.inputProps['data-testid'] = dataTestId;
  }

  return (
    <MaterialTextField
      error={Boolean(error)}
      helperText={error}
      {...inputProps}
      {...textFieldProps}
    />
  );
};

TextField.defaultProps = {
  error: null,
  dir: 'auto',
  theme: 'bordered',
};

TextField.propTypes = {
  /**
   * A test ID that gets set on the input element
   */
  'data-testid': PropTypes.string,
  /**
   * Show error message
   */
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  dir: PropTypes.string,
  /**
   * Give theme to the text field
   */
  theme: PropTypes.oneOf(['bordered', 'material', 'material-white-padded']),
  startAdornment: PropTypes.element,
  endAdornment: PropTypes.element,
  /**
   * Show large label
   */
  largeLabel: PropTypes.bool,
  /**
   * Define min number input
   */
  min: PropTypes.number,
  /**
   * Define max number input
   */
  max: PropTypes.number,
  /**
   * Show auto complete text
   */
  autoComplete: PropTypes.string,
  onPaste: PropTypes.func,
};

export default TextField;
