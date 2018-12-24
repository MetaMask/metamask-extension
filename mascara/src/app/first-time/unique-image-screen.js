import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import {connect} from 'react-redux'
import Identicon from '../../../../ui/app/components/identicon'
import Breadcrumbs from './breadcrumbs'
import { INITIALIZE_NOTICE_ROUTE } from '../../../../ui/app/routes'

class UniqueImageScreen extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    address: PropTypes.string,
    history: PropTypes.object,
  }

  render () {
    return (
      <div className="first-view-main-wrapper">
        <div className="first-view-main">
          <div className="unique-image">
            <Identicon address={this.props.address} diameter={70} />
            <div className="unique-image__title">{this.context.t('uniqueImageTitle')}</div>
            <div className="unique-image__body-text">
              {this.context.t('uniqueImageBodyText1')}
            </div>
            <div className="unique-image__body-text">
              {this.context.t('uniqueImageBodyText2')}
            </div>
            <button
              className="first-time-flow__button"
              onClick={() => this.props.history.push(INITIALIZE_NOTICE_ROUTE)}
            >
              Next
            </button>
            <Breadcrumbs total={3} currentIndex={1} />
          </div>
        </div>
      </div>
    )
  }
}

export default compose(
  withRouter,
  connect(
    ({ metamask: { selectedAddress } }) => ({
      address: selectedAddress,
    })
  )
)(UniqueImageScreen)
