import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Approve from '../icon/approve-icon.component'
import Interaction from '../icon/interaction-icon.component'
import Preloader from '../icon/preloader'
import Send from '../icon/send-icon.component'
import classnames from 'classnames'

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

export default class ListItem extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    className: PropTypes.string,
    status: PropTypes.string,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    children: PropTypes.node,
    primaryCurrency: PropTypes.string,
    secondaryCurrency: PropTypes.string,
  }

  static defaultProps = {
    status: 'pending',
  }

  render () {
    const {
      className,
      status,
      title,
      subtitle,
      children,
      primaryCurrency,
      secondaryCurrency,
    } = this.props
    const { t } = this.context

    const isApproved = status === 'approved'
    const isUnapproved = status === 'unapproved'
    const isPending = status === 'pending'
    const isFailed = status === 'failed'

    let icon = <InteractionIcon />
    if (isApproved) {
      icon = <ApproveIcon />
    } else if (isPending) {
      icon = <SendIcon />
    } else if (isFailed) {
      icon = <FailIcon />
    }

    let subtitleStatus = null
    if (isUnapproved) {
      subtitleStatus = (
        <span><span className="list-item__status--unapproved">{t('unapproved')}</span> · </span>
      )
    } else if (isFailed) {
      subtitleStatus = (
        <span><span className="list-item__status--failed">{t('failed')}</span> · </span>
      )
    }

    return (
      <div className={className}>
        <div className="list-item__col">
          { icon }
        </div>
        <div
          className={classnames('list-item__col', {
            'list-item__approved': isApproved,
          })}
        >
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
            {subtitleStatus}
            {subtitle}
          </h3>
          {children && (
            <div className="list-item__more">
              { children }
            </div>
          )}
        </div>
        <div
          className={classnames('list-item__col list-item__amount', {
            'list-item__approved': isApproved,
          })}
        >
          <h2 className="list-item__heading">{primaryCurrency}</h2>
          <h3 className="list-item__subheading">{secondaryCurrency}</h3>
        </div>
      </div>
    )
  }
}
