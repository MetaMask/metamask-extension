const { createMuiTheme } = require('@material-ui/core')

const theme = createMuiTheme({
  typography: {
    h1: {
      fontWeight: 400,
      fontSize: '2.5em',
    },
    h2: {
      fontWeight: 400,
      fontSize: '2em',
    },
    h3: {
      fontWeight: 400,
      fontSize: '1.5em',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.125em',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1em',
    },
    h6: {
      fontWeight: 400,
      fontSize: '0.875em',
    },
    body1: {
      fontWeight: 400,
      fontSize: '0.875em',
    },
    subtitle1: {
      fontWeight: 400,
      fontSize: '0.750em',
    },
    subtitle2: {
      fontWeight: 400,
      fontSize: '0.625em',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.5em',
    },
  },
})

export default theme
