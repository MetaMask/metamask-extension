import React, { Component } from 'react'
import PageContainerContent from '../../page-container/page-container-header.component'
import SendFromRow from './send-from-row/send-from-row.component'
import SendToRow from './send-to-row/send-to-row.component'
import SendAmountRow from './send-amount-row/send-amount-row.component'
import SendGasRow from './send-gas-row/send-gas-row.component'

export default class SendContent extends Component {

  render () {
    return (
      <PageContainerContent>
        <div className='.send-v2__form'>
          <SendFromRow />
          <SendToRow />
          <SendAmountRow />
          <SendGasRow />
        </div>
      </PageContainerContent>
    );
  }

}
