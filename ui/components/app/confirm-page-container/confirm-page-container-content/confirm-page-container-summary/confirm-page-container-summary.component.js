/* eslint-disable no-negated-condition */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../../ui/identicon';

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
    image,
  } = props;

  const renderImage = () => {
    if (image) {
      return (
        <img
          className="confirm-page-container-summary__icon"
          width={36}
          src={image}
        />
      );
    } else if (identiconAddress) {
      return (
        <Identicon
          className="confirm-page-container-summary__icon"
          diameter={36}
          address={identiconAddress}
          image={image}
        />
      );
    }
    return null;
  };

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
      <>
        <div className="confirm-page-container-summary__title">
          {renderImage()}
          {!hideTitle ? (
            <div className="confirm-page-container-summary__title-text">
              {titleComponent || title}
            </div>
          ) : null}
        </div>
        {hideSubtitle ? null : (
          <div className="confirm-page-container-summary__subtitle">
            {subtitleComponent}
          </div>
        )}
      </>
    </div>
  );
};

ConfirmPageContainerSummary.propTypes = {
  action: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  image: PropTypes.string,
  titleComponent: PropTypes.node,
  subtitleComponent: PropTypes.node,
  hideSubtitle: PropTypes.bool,
  className: PropTypes.string,
  identiconAddress: PropTypes.string,
  nonce: PropTypes.string,
  origin: PropTypes.string.isRequired,
  hideTitle: PropTypes.bool,
};

export default ConfirmPageContainerSummary;
