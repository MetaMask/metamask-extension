import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';

import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';

export default function SwapsFooter({
  onCancel,
  hideCancel,
  onSubmit,
  submitText,
  disabled,
  showTermsOfService,
  showTopBorder,
  className = '',
  cancelText,
}) {
  const t = useContext(I18nContext);

  return (
    <div className="swaps-footer">
      <div
        className={classnames('swaps-footer__buttons', className, {
          'swaps-footer__buttons--border': showTopBorder,
        })}
      >
        <PageContainerFooter
          onCancel={onCancel}
          hideCancel={hideCancel}
          cancelText={cancelText || t('back')}
          onSubmit={onSubmit}
          submitText={submitText}
          footerClassName={classnames(
            'swaps-footer__custom-page-container-footer-class',
            className,
          )}
          footerButtonClassName={classnames(
            'swaps-footer__custom-page-container-footer-button-class',
            {
              'swaps-footer__custom-page-container-footer-button-class--single':
                hideCancel,
            },
          )}
          disabled={disabled}
        />
      </div>
      {showTermsOfService && (
        <div
          className="swaps-footer__bottom-text"
          onClick={() =>
            global.platform.openTab({ url: 'https://metamask.io/terms.html' })
          }
        >
          {t('termsOfService')}
        </div>
      )}
    </div>
  );
}

SwapsFooter.propTypes = {
  onCancel: PropTypes.func,
  hideCancel: PropTypes.bool,
  onSubmit: PropTypes.func,
  submitText: PropTypes.string,
  disabled: PropTypes.bool,
  showTermsOfService: PropTypes.bool,
  showTopBorder: PropTypes.bool,
  className: PropTypes.string,
  cancelText: PropTypes.string,
};
