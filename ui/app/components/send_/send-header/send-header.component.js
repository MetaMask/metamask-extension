import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerHeader from '../../page-container/page-container-header.component'
import { DEFAULT_ROUTE } from '../../../routes'

export default class SendHeader extends Component {

  static propTypes = {
    clearSend: PropTypes.func,
    history: PropTypes.object,
    isToken: PropTypes.bool,
  };

  render () {
    const { isToken, clearSend, history } = this.props

    return (
      <PageContainerHeader
        onClose={() => {
          clearSend()
          history.push(DEFAULT_ROUTE)
        }}
        subtitle={this.context.t('onlySendToEtherAddress')}
        title={isToken ? this.context.t('sendTokens') : this.context.t('sendETH')}
      />
    )
  }

}

SendHeader.contextTypes = {
  t: PropTypes.func,
}
