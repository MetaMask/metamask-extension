import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class PermissionsConnectFooter extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { t } = this.context
    return (
      <div className="permissions-connect-footer">
        <img src="/images/mm-secure.svg" />
        <div className="permissions-connect-footer__text">
          <div>{ t('onlyConnectTrust') }</div>
          <div className="permissions-connect-footer__text--link">{ t('learnAboutRisks') }</div>
        </div>
      </div>
    )
  }
}
