import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const Tab = props => {
  const { name, onClick, isActive, tabIndex } = props

  return (
    <li
      className={classnames(
        'tab',
        isActive && 'tab--active',
      )}
      onClick={event => {
        event.preventDefault()
        onClick(tabIndex)
      }}
    >
      { name }
    </li>
  )
}

Tab.propTypes = {
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
  tabIndex: PropTypes.number,
}

export default Tab
