/* eslint-disable no-negated-condition */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../../ui/identicon';
import { useGasFeeContext } from '../../../../../contexts/gasFee';

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
    hideTitle,
  } = props;

  const { supportsEIP1559V2 } = useGasFeeContext();

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
        {!hideTitle ? (
          <div className="confirm-page-container-summary__title-text">
            {titleComponent || title}
          </div>
        ) : null}
      </div>
      {!hideSubtitle && !supportsEIP1559V2 && (
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
  hideTitle: PropTypes.boolean,
};

export default ConfirmPageContainerSummary;
