/* eslint-disable @metamask/design-tokens/color-no-hex*/
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeType } from '../../../../shared/constants/preferences';

const LOGO_WIDTH = 162;
const LOGO_HEIGHT = 30;

export default function MetaFoxHorizontalLogo({
  theme: themeProps,
  className,
}) {
  const [theme, setTheme] = useState(() =>
    themeProps === undefined
      ? document.documentElement.getAttribute('data-theme')
      : themeProps,
  );

  const fill = theme === ThemeType.dark ? 'rgb(255,255,255)' : 'rgb(22,22,22)';

  useEffect(() => {
    let newTheme = themeProps;
    if (newTheme === undefined) {
      newTheme = document.documentElement.getAttribute('data-theme');
    }
    setTheme(newTheme);
  }, [themeProps, setTheme]);

  return (
    <svg
      height={LOGO_HEIGHT}
      width={LOGO_WIDTH}
      viewBox="0 0 696 344"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crypto Bridge 文字 */}
      <text
        x="50"
        y="200"
        fontSize="104"
        fontWeight="bold"
        fill={fill}
        fontFamily="Arial, sans-serif"
      >
        Crypto
      </text>
      <text
        x="50"
        y="280"
        fontSize="104"
        fontWeight="bold"
        fill={fill}
        fontFamily="Arial, sans-serif"
      >
        Bridge
      </text>
    </svg>
  );
}

MetaFoxHorizontalLogo.propTypes = {
  theme: PropTypes.oneOf([ThemeType.light, ThemeType.dark, ThemeType.os]),
  className: PropTypes.string,
};
