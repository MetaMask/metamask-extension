import React from 'react';
import PropTypes from 'prop-types';

/**
 * @deprecated This has been deprecated in favor of the `<Icon />` component in ./ui/components/component-library/icon/icon.js
 * See storybook documentation for Icon here https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-icon--default-story#icon
 */

const Send = ({ className, size, color }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" stroke={color} />
    <path
      d="M18.5851 9.88921C18.5586 9.89005 18.5321 9.89238 18.5057 9.89618H14.3207C14.0635 9.89254 13.8243 10.0276 13.6947 10.2497C13.565 10.4719 13.565 10.7466 13.6947 10.9687C13.8243 11.1908 14.0635 11.3259 14.3207 11.3222H16.8777L9.53811 18.6614C9.35182 18.8402 9.27679 19.1058 9.34193 19.3557C9.40707 19.6056 9.60222 19.8007 9.85211 19.8658C10.102 19.931 10.3676 19.8559 10.5464 19.6697L17.886 12.3305V14.8874C17.8823 15.1445 18.0175 15.3837 18.2396 15.5133C18.4617 15.643 18.7364 15.643 18.9585 15.5133C19.1806 15.3837 19.3158 15.1445 19.3121 14.8874V10.6997C19.3409 10.4919 19.2767 10.282 19.1366 10.1259C18.9965 9.96973 18.7948 9.88316 18.5851 9.88921Z"
      fill={color}
    />
  </svg>
);

Send.defaultProps = {
  className: undefined,
};

Send.propTypes = {
  /**
   * Additional className
   */
  className: PropTypes.string,
  /**
   * Size of the icon should adhere to 8px grid. e.g: 8, 16, 24, 32, 40 and is required
   */
  size: PropTypes.number.isRequired,
  /**
   * Color of the icon should be a valid design system color and is required
   */
  color: PropTypes.string.isRequired,
};

export default Send;
