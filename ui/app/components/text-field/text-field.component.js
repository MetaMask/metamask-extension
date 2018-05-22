import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { default as MaterialTextField } from '@material-ui/core/TextField'

const styles = {
  materialLabel: {
    '&$materialFocused': {
      color: '#aeaeae',
    },
    '&$materialError': {
      color: '#aeaeae',
    },
    fontWeight: '400',
    color: '#aeaeae',
  },
  materialFocused: {},
  materialUnderline: {
    '&:after': {
      borderBottom: '2px solid #f7861c',
    },
  },
  materialError: {},
  // Non-material styles
  formLabel: {
    '&$formLabelFocused': {
      color: '#5b5b5b',
    },
    '&$materialError': {
      color: '#5b5b5b',
    },
  },
  formLabelFocused: {},
  inputFocused: {},
  inputRoot: {
    'label + &': {
      marginTop: '8px',
    },
    border: '1px solid #d2d8dd',
    height: '48px',
    borderRadius: '4px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    '&$inputFocused': {
      border: '1px solid #2f9ae0',
    },
  },
  inputLabel: {
    fontSize: '.75rem',
    transform: 'none',
    transition: 'none',
    position: 'initial',
    color: '#5b5b5b',
  },
}

class TextField extends Component {
  static defaultProps = {
    error: null,
  }

  static propTypes = {
    error: PropTypes.string,
    classes: PropTypes.object,
    material: PropTypes.bool,
    startAdornment: PropTypes.element,
  }

  render () {
    const { error, classes, material, startAdornment, ...textFieldProps } = this.props

    return (
      <MaterialTextField
        error={Boolean(error)}
        helperText={error}
        InputLabelProps={{
          shrink: material ? undefined : true,
          className: material ? '' : classes.inputLabel,
          FormLabelClasses: {
            root: material ? classes.materialLabel : classes.formLabel,
            focused: material ? classes.materialFocused : classes.formLabelFocused,
            error: classes.materialError,
          },
        }}
        InputProps={{
          startAdornment: startAdornment || undefined,
          disableUnderline: !material,
          classes: {
            root: material ? '' : classes.inputRoot,
            input: material ? '' : classes.input,
            underline: material ? classes.materialUnderline : '',
            focused: material ? '' : classes.inputFocused,
          },
        }}
        {...textFieldProps}
      />
    )
  }
}

export default withStyles(styles)(TextField)
