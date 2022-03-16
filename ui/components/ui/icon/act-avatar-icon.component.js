import React from 'react';
import PropTypes from 'prop-types';

const ActAvatar = ({ className, txtClassName, width = '24', height = '24', text = 'T' }) => (
  <div
    className={className}
    style={{
      width: width + 'px',
      height: height + 'px',
      background: 'linear-gradient(91.07deg, #227BFF 4.72%, #451DFF 73%)',
      'border-radius': '50%',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
    }}
  >
    <p
      className={txtClassName}
      style=
      {{
        'text-align': 'center',
        color: 'white',
        lineHeight: '1rem'
      }}>
      {text}
    </p>
  </div>
);

ActAvatar.defaultProps = {
  className: undefined,
};

ActAvatar.propTypes = {
  /**
   * Additional className
   */
  className: PropTypes.string,
  txtClassName: PropTypes.string,
  /**
   * Size of the icon should adhere to 8px grid. e.g: 8, 16, 24, 32, 40
   */
  width: PropTypes.string,
  height: PropTypes.string,
  text: PropTypes.string,
};

export default ActAvatar;
