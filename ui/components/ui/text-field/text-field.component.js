import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import MaterialTextField from '@material-ui/core/TextField';

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

const styles = {
  materialLabel: {
    '&$materialFocused': {
      color: 'var(--color-text-alternative)',
    },
    '&$materialError': {
      color: 'var(--color-text-alternative)',
    },
    fontWeight: '400',
    color: 'var(--color-text-alternative)',
  },
  materialFocused: {},
  materialUnderline: {
    '&:before': {
      borderBottom: '1px solid var(--color-text-default) !important', // Visible bottom border
    },
    '&:after': {
      borderBottom: `2px solid var(--color-primary-default)`, // Animated bottom border
    },
  },
  materialError: {},
  materialWhitePaddedRoot: {
    color: 'var(--color-text-alternative)',
  },
  materialWhitePaddedInput: {
    padding: '8px',

    '&::placeholder': {
      color: 'var(--color-text-alternative)',
    },
  },
  materialWhitePaddedFocused: {
    color: 'var(--color-background-default)',
  },
  materialWhitePaddedUnderline: {
    '&:after': {
      borderBottom: '2px solid var(--color-background-default)', // @TODO: Replace with border-muted ?
    },
  },
  // Non-material styles
  formLabel: {
    '&$formLabelFocused': {
      color: 'var(--color-text-alternative)',
    },
    '&$materialError': {
      color: 'var(--color-text-alternative)',
    },
  },
  formLabelFocused: {},
  inputFocused: {},
  inputRoot: {
    'label + &': {
      marginTop: '9px',
    },
    backgroundColor: 'var(--color-background-default)',
    border: '1px solid var(--color-border-default)',
    color: 'var(--color-text-default)',
    height: '48px',
    borderRadius: '6px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    '&$inputFocused': {
      border: '1px solid var(--color-primary-default)',
    },
  },
  largeInputLabel: {
    ...inputLabelBase,
    fontSize: '1rem',
  },
  inputLabel: {
    ...inputLabelBase,
    fontSize: '.75rem',
  },
  inputMultiline: {
    lineHeight: 'initial !important',
  },
};

const getMaterialThemeInputProps = ({
  dir,
  classes: { materialLabel, materialFocused, materialError, materialUnderline },
  startAdornment,
  endAdornment,
  min,
  max,
  autoComplete,
}) => ({
  InputLabelProps: {
    classes: {
      root: materialLabel,
      focused: materialFocused,
      error: materialError,
    },
  },
  InputProps: {
    startAdornment,
    endAdornment,
    classes: {
      underline: materialUnderline,
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
  classes: {
    materialWhitePaddedRoot,
    materialWhitePaddedFocused,
    materialWhitePaddedInput,
    materialWhitePaddedUnderline,
  },
  startAdornment,
  endAdornment,
  min,
  max,
  autoComplete,
}) => ({
  InputProps: {
    startAdornment,
    endAdornment,
    classes: {
      root: materialWhitePaddedRoot,
      focused: materialWhitePaddedFocused,
      input: materialWhitePaddedInput,
      underline: materialWhitePaddedUnderline,
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
  classes: {
    formLabel,
    formLabelFocused,
    materialError,
    largeInputLabel,
    inputLabel,
    inputRoot,
    input,
    inputFocused,
  },
  largeLabel,
  startAdornment,
  endAdornment,
  min,
  max,
  autoComplete,
}) => ({
  InputLabelProps: {
    shrink: true,
    className: largeLabel ? largeInputLabel : inputLabel,
    classes: {
      root: formLabel,
      focused: formLabelFocused,
      error: materialError,
    },
  },
  InputProps: {
    startAdornment,
    endAdornment,
    disableUnderline: true,
    classes: {
      root: inputRoot,
      input,
      focused: inputFocused,
    },
    inputProps: {
      dir,
      min,
      max,
      autoComplete,
    },
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
  classes,
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
    classes,
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
  /**
   * Add custom CSS class
   */
  classes: PropTypes.object,
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

export default withStyles(styles)(TextField);
