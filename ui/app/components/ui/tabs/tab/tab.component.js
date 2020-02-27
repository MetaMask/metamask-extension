import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const Tab = (props) => {
  const { name, onClick, isActive, tabIndex, className } = props

  return (
    <li
      className={classnames(
        'tab',
        className,
        { 'tab--active': isActive },
      )}
      onClick={(event) => {
        event.preventDefault()
        onClick(tabIndex)
      }}
    >
      { name }
    </li>
  )
}

Tab.propTypes = {
  className: PropTypes.string,
  isActive: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  tabIndex: PropTypes.number.isRequired,
}

Tab.defaultProps = {
  className: undefined,
  onClick: undefined,
}

export default Tab
