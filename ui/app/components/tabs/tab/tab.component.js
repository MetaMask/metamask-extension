import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const Tab = props => {
  const { name, onClick, isActive, tabIndex, className, activeClassName } = props

  return (
    <li
      className={classnames(
        className,
        { [activeClassName]: isActive },
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
  className: PropTypes.string,
  activeClassName: PropTypes.string,
}

Tab.defaultProps = {
  className: 'tab',
  activeClassName: 'tab--active',
}

export default Tab
