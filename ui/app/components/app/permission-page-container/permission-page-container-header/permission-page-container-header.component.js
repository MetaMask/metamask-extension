import React, { PureComponent } from 'react'
import NetworkDisplay from '../../network-display'

const ProviderPageContainerHeader = props => {
  return (
    <div className="provider-approval-container__header">
      <NetworkDisplay colored={false} />
    </div>
  )
};

export default ProviderPageContainerHeader
