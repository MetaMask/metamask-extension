import React, { Component } from 'react'
import PageContainerContent from '../../page-container/page-container-content.component'
import SendAmountRow from './send-amount-row/'
import SendFromRow from './send-from-row/'
import SendGasRow from './send-gas-row/'
import SendToRow from './send-to-row/'

export default class SendContent extends Component {

  render () {
    return (
      <PageContainerContent>
        <div className="send-v2__form">
          <SendFromRow />
          <SendToRow />
          <SendAmountRow />
          <SendGasRow />
        </div>
      </PageContainerContent>
    )
  }

}
