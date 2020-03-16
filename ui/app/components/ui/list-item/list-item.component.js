
import React from 'react'
import PropTypes from 'prop-types'
import Approve from '../icon/approve-icon.component'
import Interaction from '../icon/interaction-icon.component'
import Preloader from '../icon/preloader'
import Send from '../icon/send-icon.component'

const SendIcon = () => (
  <Send
    className="list-item__icon"
    size={28}
    color="#2F80ED"
  />
)

const InteractionIcon = () => (
  <Interaction
    className="list-item__icon"
    size={28}
    color="#2F80ED"
  />
)

const ApproveIcon = () => (
  <Approve
    className="list-item__icon"
    size={28}
    color="#2F80ED"
  />
)

const FailIcon = () => (
  <Interaction
    className="list-item__icon"
    size={28}
    color="#D73A49"
  />
)

const Item = ({
  className,
  status,
  title,
  subtitle,
  children,
  nativeCurrency,
  currentCurrency,
}) => {
  const isApproved = status === 'approved'
  const isUnapproved = status === 'unapproved'
  const isPending = status === 'pending'
  const isFailed = status === 'failed'

  return (
    <div className={className}>
      <div className="list-item__col">
        {isApproved ? (
          <ApproveIcon />
        ) : isPending ? (
          <SendIcon />
        ) : isFailed ? (
          <FailIcon />
        ) : (
          <InteractionIcon />
        )}
      </div>
      <div className={`list-item__col ${isApproved ? ' list-item__approved' : ''}`}>
        <h2 className="list-item__heading">
          { title } {isPending && (
            <span className="list-item__heading-wrap">
              <Preloader
                size={16}
                color="#D73A49"
              />
            </span>
          )}
        </h2>
        <h3 className="list-item__subheading">
          {isUnapproved ? (
            <span><span className="list-item__status--unapproved">Unapproved</span> · </span>
          ) : isFailed ? (
            <span><span className="list-item__status--failed">Failed</span> · </span>
          ) : null}
          {subtitle}
        </h3>
        {children && (
          <div className="list-item__more">
            { children }
          </div>
        )}
      </div>
      <div className={`list-item__col list-item__amount${isApproved ? ' list-item__approved' : ''}`}>
        <h2 className="list-item__heading">{nativeCurrency}</h2>
        <h3 className="list-item__subheading">{currentCurrency}</h3>
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
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  nativeCurrency: PropTypes.string,
  currentCurrency: PropTypes.string,
}

export default Item
