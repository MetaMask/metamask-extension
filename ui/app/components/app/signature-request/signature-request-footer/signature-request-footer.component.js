import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../ui/button'

export default class SignatureRequest extends PureComponent {
  static propTypes = {
    cancelAction: PropTypes.func.isRequired,
    signAction: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { cancelAction, signAction } = this.props
    return (
      <div className="signature-request-footer">
        <Button onClick={cancelAction} type="default" large>{this.context.t('cancel')}</Button>
        <Button onClick={signAction} type="secondary" large>{this.context.t('sign')}</Button>
      </div>
    )
  }
}
