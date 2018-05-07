import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerHeader from '../../page-container/page-container-header'
import { DEFAULT_ROUTE } from '../../../routes'

export default class SendHeader extends Component {

  static propTypes = {
    clearSend: PropTypes.func,
    history: PropTypes.object,
    isToken: PropTypes.bool,
  };

  onClose () {
    this.props.clearSend()
    this.props.history.push(DEFAULT_ROUTE)
  }

  render () {
    return (
      <PageContainerHeader
        onClose={() => this.onClose()}
        subtitle={this.context.t('onlySendToEtherAddress')}
        title={this.props.isToken ? this.context.t('sendTokens') : this.context.t('sendETH')}
      />
    )
  }

}

SendHeader.contextTypes = {
  t: PropTypes.func,
}
