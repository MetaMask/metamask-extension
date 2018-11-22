import React, {PureComponent} from 'react'
import NetworkDisplay from '../../network-display'

export default class ProviderPageContainerHeader extends PureComponent {
  render () {
    return (
      <div className="provider-approval-container__header">
        <NetworkDisplay colored={false} />
      </div>
    )
  }
}
