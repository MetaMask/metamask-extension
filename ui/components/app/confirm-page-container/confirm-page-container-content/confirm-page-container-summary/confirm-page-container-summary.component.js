import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../../ui/identicon';
import { TRANSACTION_TYPES } from '../../../../../../shared/constants/transaction';

const ConfirmPageContainerSummary = (props) => {
  const {
    action,
    title,
    titleComponent,
    subtitleComponent,
    hideSubtitle,
    className,
    identiconAddress,
    nonce,
    origin,
    type,
  } = props;

  return (
    <div className={classnames('confirm-page-container-summary', className)}>
      {origin === 'metamask' ? null : (
        <div className="confirm-page-container-summary__origin">{origin}</div>
      )}
      <div className="confirm-page-container-summary__action-row">
        <div className="confirm-page-container-summary__action">{action}</div>
        {nonce && (
          <div className="confirm-page-container-summary__nonce">
            {`#${nonce}`}
          </div>
        )}
      </div>
      <div className="confirm-page-container-summary__title">
        {identiconAddress && (
          <Identicon
            className="confirm-page-container-summary__identicon"
            diameter={36}
            address={identiconAddress}
          />
        )}
        {(type !== TRANSACTION_TYPES.CONTRACT_INTERACTION ||
          type !== TRANSACTION_TYPES.DEPLOY_CONTRACT) &&
          titleComponent &&
          titleComponent.props.value !== '0x0' && (
            <div className="confirm-page-container-summary__title-text">
              {titleComponent || title}
            </div>
          )}
      </div>
      {hideSubtitle || (
        <div className="confirm-page-container-summary__subtitle">
          {subtitleComponent}
        </div>
      )}
    </div>
  );
};

ConfirmPageContainerSummary.propTypes = {
  action: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  titleComponent: PropTypes.node,
  subtitleComponent: PropTypes.node,
  hideSubtitle: PropTypes.bool,
  className: PropTypes.string,
  identiconAddress: PropTypes.string,
  nonce: PropTypes.string,
  origin: PropTypes.string.isRequired,
  type: PropTypes.string,
};

export default ConfirmPageContainerSummary;
