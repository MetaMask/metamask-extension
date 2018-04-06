import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerHeader from '../../page-container/page-container-header.component'

export default class SendHeader extends Component {

  static propTypes = {
    isToken: PropTypes.bool,
    clearSend: PropTypes.func,
    goHome: PropTypes.func,
  };

  render () {
    const { isToken, clearSend, goHome } = this.props

    return (
      <PageContainerHeader
        title={isToken ? this.context.t('sendTokens') : this.context.t('sendETH')}
        subtitle={this.context.t('onlySendToEtherAddress')}
        onClose={() => {
          clearSend()
          goHome()
        }}
      />
    );
  }

}

SendHeader.contextTypes = {
  t: PropTypes.func,
}
