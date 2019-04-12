import React, {PureComponent} from 'react'
import NetworkDisplay from '../../network-display'

export default class PermissionPageContainerHeader extends PureComponent {
  render () {
    return (
      <div className="permission-approval-container__header">
        <NetworkDisplay colored={false} />
      </div>
    )
  }
}
