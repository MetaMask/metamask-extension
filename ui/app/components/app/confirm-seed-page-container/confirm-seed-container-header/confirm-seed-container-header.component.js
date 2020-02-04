import React from 'react'
import NetworkDisplay from '../../network-display'

const ConfirmSeedPageContainerHeader = () => {
  return (
    <div className="provider-approval-container__header">
      <NetworkDisplay colored={false} />
    </div>
  )
}

export default ConfirmSeedPageContainerHeader
