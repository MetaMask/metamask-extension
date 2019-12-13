
import React from 'react'
import PropTypes from 'prop-types'

const Item = ({
  className,
  status,
  icon,
  title,
  subtitle,
  more,
  crypto,
  cash,
}) => {
  const active = status === 'approved'
  if (status === 'unapproved') {
    subtitle = (
      <h3>
        <span className="unapproved">Unapproved</span> · {subtitle}
      </h3>
    )
  }

  return (
    <div className={className}>
      <div className="col icon">
        {icon}
      </div>
      <div className={`col main${active ? ' active' : ''}`}>
        {typeof title === 'string' ? (
          <h2>{ title }</h2>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <h3>{ subtitle }</h3>
        ) : (
          subtitle
        )}
        {more && (
          <div className="more">
            { more }
          </div>
        )}
      </div>
      <div className={`col amount${active ? ' active' : ''}`}>
        <h2>{crypto}</h2>
        <h3>{cash}</h3>
      </div>
    </div>
  )
}

Item.defaultProps = {
  active: false,
  status: 'pending',
}

Item.propTypes = {
  className: PropTypes.string,
  active: PropTypes.bool,
  status: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]).isRequired,
  subtitle: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]).isRequired,
  more: PropTypes.number,
  crypto: PropTypes.string,
  cash: PropTypes.string,
}

export default Item
