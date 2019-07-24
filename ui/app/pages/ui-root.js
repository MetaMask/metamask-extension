import React from 'react'
import PropTypes from 'prop-types'
import Routes from './routes'
import Root from './root'

const UiRoot = (props) => {
  const { store } = props

  return (
    <Root store={store}>
      <Routes />
    </Root>
  )
}

UiRoot.propTypes = {
  store: PropTypes.object,
}

export default UiRoot
