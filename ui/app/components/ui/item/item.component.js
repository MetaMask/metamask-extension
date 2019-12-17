
import React from 'react'
import PropTypes from 'prop-types'
import Icon from '../icon'
import Preloader from '../preloader'

const SendIcon = () => (
  <Icon
    type="send"
    width={28}
    height={28}
    color="#2F80ED"
  />
)

const InteractionIcon = () => (
  <Icon
    type="interaction"
    width={28}
    height={28}
    color="#2F80ED"
  />
)

const ApproveIcon = () => (
  <Icon
    type="approve"
    width={28}
    height={28}
    color="#2F80ED"
  />
)

const FailIcon = () => (
  <Icon
    type="interaction"
    width={28}
    height={28}
    color="#D73A49"
  />
)

const Item = ({
  className,
  status,
  title,
  subtitle,
  more,
  crypto,
  cash,
}) => {
  const isApproved = status === 'approved'
  const isPending = status === 'pending'
  const isFailed = status === 'failed'

  if (status === 'unapproved') {
    subtitle = (
      <h3>
        <span className="unapproved">Unapproved</span> · {subtitle}
      </h3>
    )
  }

  if (isFailed) {
    subtitle = (
      <h3>
        <span className="failed">Failed</span> · {subtitle}
      </h3>
    )
  }

  return (
    <div className={className}>
      <div className="col icon">
        {isApproved ? (
          <ApproveIcon />
        ) : isPending ? (
          <InteractionIcon />
        ) : isFailed ? (
          <FailIcon />
        ) : (
          <SendIcon />
        )}
      </div>
      <div className={`col main${isApproved ? ' approved' : ''}`}>
        {typeof title === 'string' ? (
          <h2>{ title } {isPending && <span><Preloader className="preloader" /></span>}</h2>
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
      <div className={`col amount${isApproved ? ' approved' : ''}`}>
        <h2>{crypto}</h2>
        <h3>{cash}</h3>
      </div>
    </div>
  )
}

Item.defaultProps = {
  status: 'pending',
}

Item.propTypes = {
  className: PropTypes.string,
  status: PropTypes.string,
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]).isRequired,
  subtitle: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]).isRequired,
  more: PropTypes.node,
  crypto: PropTypes.string,
  cash: PropTypes.string,
}

export default Item
