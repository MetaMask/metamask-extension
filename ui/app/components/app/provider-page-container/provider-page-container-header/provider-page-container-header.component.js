import React from 'react'
import NetworkDisplay from '../../network-display'

<<<<<<< HEAD:ui/app/components/app/provider-page-container/provider-page-container-header/provider-page-container-header.component.js
export default class ProviderPageContainerHeader extends PureComponent {
  render () {
    return (
      <div className="provider-approval-container__header">
        <NetworkDisplay colored={false} />
      </div>
    )
  }
=======
const ProviderPageContainerHeader = () => {
  return (
    <div className="provider-approval-container__header">
      <NetworkDisplay colored={false} />
    </div>
  )
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc:ui/app/components/app/permission-page-container/permission-page-container-header/permission-page-container-header.component.js
}

export default ProviderPageContainerHeader
