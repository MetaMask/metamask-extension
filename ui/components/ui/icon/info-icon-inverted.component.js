import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { SEVERITIES } from '../../../helpers/constants/design-system';

/**
 * @deprecated This has been deprecated in favor of the `<Icon />` component in ./ui/components/component-library/icon/icon.js
 * See storybook documentation for Icon here https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-icon--default-story#icon
 */

export default function InfoIconInverted({ severity }) {
  const className = classnames('info-icon', {
    'info-icon--success': severity === SEVERITIES.SUCCESS,
    'info-icon--warning': severity === SEVERITIES.WARNING,
    'info-icon--danger': severity === SEVERITIES.DANGER,
    'info-icon--info': severity === SEVERITIES.INFO,
  });
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.75 8C15.75 3.75 12.25 0.25 8 0.25C3.71875 0.25 0.25 3.75 0.25 8C0.25 12.2812 3.71875 15.75 8 15.75C12.25 15.75 15.75 12.2812 15.75 8ZM8 9.5625C8.78125 9.5625 9.4375 10.2188 9.4375 11C9.4375 11.8125 8.78125 12.4375 8 12.4375C7.1875 12.4375 6.5625 11.8125 6.5625 11C6.5625 10.2188 7.1875 9.5625 8 9.5625ZM6.625 4.40625C6.59375 4.1875 6.78125 4 7 4H8.96875C9.1875 4 9.375 4.1875 9.34375 4.40625L9.125 8.65625C9.09375 8.875 8.9375 9 8.75 9H7.21875C7.03125 9 6.875 8.875 6.84375 8.65625L6.625 4.40625Z" />
    </svg>
  );
}

InfoIconInverted.propTypes = {
  /**
   * Severity can be 1 of 4 states:'danger', 'warning', 'info' or 'success'
   */
  severity: PropTypes.oneOf(Object.values(SEVERITIES)),
};
