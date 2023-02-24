import React from 'react';
import PropTypes from 'prop-types';

const CustodyLabels = (props) => {
  const { labels, index, background, hideNetwork } = props;
  const filteredLabels = hideNetwork
    ? labels.filter((item) => item.key !== 'network_name')
    : labels;

  return (
    <label
      htmlFor={`address-${index || 0}`}
      className="custody-labels-container allcaps"
    >
      {filteredLabels.map((item) => (
        <div
          key={item.key}
          className="custody-label allcaps"
          style={background ? { background } : {}}
        >
          {item.value}
        </div>
      ))}
    </label>
  );
};

CustodyLabels.propTypes = {
  labels: PropTypes.array,
  index: PropTypes.string,
  background: PropTypes.string,
  hideNetwork: PropTypes.bool,
};

export default CustodyLabels;
