import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import IconWithFallBack from '../../../components/ui/icon-with-fallback'
import { I18nContext } from '../../../contexts/i18n'

export default function PermissionsRedirect ({ domainMetadata, permissionsRejected }) {

  const t = useContext(I18nContext)

  return (
    <div className="page-container permissions-redirect-container">
      <div className="permissions-redirect-container__content">
        <div className="permission-result">
          { permissionsRejected ? t('cancelling') : t('connecting') }
          <div className="permission-result__icons">
            <IconWithFallBack icon={domainMetadata.icon} name={domainMetadata.name} />
            <div className="permission-result__center-icon">
              { permissionsRejected
                ? <span className="permission-result__reject" ><i className="fa fa-times-circle" /></span>
                : <span className="permission-result__check" />
              }
              { renderBrokenLine() }
            </div>
            <div className="permission-result__identicon-container">
              <div className="permission-result__identicon-border">
                <img src="/images/logo/metamask-fox.svg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  function renderBrokenLine () {
    return (
      <svg width="131" height="2" viewBox="0 0 131 2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 1H134" stroke="#CDD1E4" strokeLinejoin="round" strokeDasharray="8 7" />
      </svg>
    )
  }
}

PermissionsRedirect.propTypes = {
  domainMetadata: PropTypes.object.isRequired,
  permissionsRejected: PropTypes.bool,
}

PermissionsRedirect.defaultProps = {
  permissionsRejected: null,
}
