import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import { default as MaterialTextField } from 'material-ui/TextField'

const styles = {
  cssLabel: {
    '&$cssFocused': {
      color: '#aeaeae',
    },
    fontWeight: '400',
    color: '#aeaeae',
  },
  cssFocused: {},
  cssUnderline: {
    '&:after': {
      backgroundColor: '#f7861c',
    },
  },
}

const TextField = props => {
  const { error, classes, ...textFieldProps } = props

  return (
    <MaterialTextField
      error={Boolean(error)}
      helperText={error}
      InputLabelProps={{
        FormLabelClasses: {
          root: classes.cssLabel,
          focused: classes.cssFocused,
        },
      }}
      InputProps={{
        classes: {
          underline: classes.cssUnderline,
        },
      }}
      {...textFieldProps}
    />
  )
}

TextField.defaultProps = {
  error: null,
}

TextField.propTypes = {
  error: PropTypes.string,
  classes: PropTypes.object,
}

export default withStyles(styles)(TextField)
