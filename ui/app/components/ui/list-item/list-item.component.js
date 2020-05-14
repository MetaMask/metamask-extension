import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default function ListItem ({ title, subtitle, onClick, subtitleStatus, children, titleIcon, icon, rightContent, className }) {
  const primaryClassName = classnames('list-item', className)

  return (
    <div className={primaryClassName} onClick={onClick}>
      {icon && (
        <div className="list-item__col list-item__icon">
          {icon}
        </div>
      )}
      <div className="list-item__col list-item__col-main">
        <h2 className="list-item__heading">
          { title } {titleIcon && (
            <span className="list-item__heading-wrap">
              {titleIcon}
            </span>
          )}
        </h2>
        <h3 className="list-item__subheading">
          {subtitleStatus}{subtitle}
        </h3>
        {children && (
          <div className="list-item__more">
            { children }
          </div>
        )}
      </div>
      {rightContent && (
        <div className="list-item__col list-item__right-content">
          {rightContent}
        </div>
      )}
    </div>
  )
}

ListItem.propTypes = {
  title: PropTypes.string.isRequired,
  titleIcon: PropTypes.node,
  subtitle: PropTypes.string,
  subtitleStatus: PropTypes.node,
  children: PropTypes.node,
  icon: PropTypes.node,
  rightContent: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
}
