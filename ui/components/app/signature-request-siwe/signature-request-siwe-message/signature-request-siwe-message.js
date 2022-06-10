import React from 'react';
import PropTypes from 'prop-types';

const SignatureRequestSIWEMessage = ({ data }) => {
  return (
    <div className="signature-request-siwe-message">
      <div className="signature-request-siwe-message__list">
        {data.map(({ label, value }, i) => (
          <div
            className="signature-request-siwe-message__list__item"
            key={i.toString()}
          >
            <div className="signature-request-siwe-message__list__item__label">
              {label}
            </div>
            <div className="signature-request-siwe-message__list__item__value">{`${value}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

SignatureRequestSIWEMessage.propTypes = {
  /**
   * The data array that contains objects of data about the message
   */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      /**
       * The label or title of the value data
       */
      label: PropTypes.string,
      /**
       * The value of the data
       */
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
};

export default React.memo(SignatureRequestSIWEMessage);
