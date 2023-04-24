import React, { useRef, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  BLOCK_SIZES,
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';

import { HeaderBaseProps } from './header-base.types';

export const HeaderBase: React.FC<HeaderBaseProps> = ({
  startAccessory,
  endAccessory,
  className = '',
  children,
  childrenWrapperProps,
  startAccessoryWrapperProps,
  endAccessoryWrapperProps,
  ...props
}) => {
  const startAccessoryRef = useRef<HTMLDivElement>(null);
  const endAccessoryRef = useRef<HTMLDivElement>(null);
  const [accessoryMinWidth, setAccessoryMinWidth] = useState<number>();

  useEffect(() => {
    function handleResize() {
      if (startAccessoryRef.current && endAccessoryRef.current) {
        const accMinWidth = Math.max(
          startAccessoryRef.current.scrollWidth,
          endAccessoryRef.current.scrollWidth,
        );
        setAccessoryMinWidth(accMinWidth);
      } else if (startAccessoryRef.current && !endAccessoryRef.current) {
        setAccessoryMinWidth(startAccessoryRef.current.scrollWidth);
      } else if (!startAccessoryRef.current && endAccessoryRef.current) {
        setAccessoryMinWidth(endAccessoryRef.current.scrollWidth);
      } else {
        setAccessoryMinWidth(0);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [startAccessoryRef, endAccessoryRef, children]);

  const getTitleStyles = useMemo(() => {
    if (startAccessory && !endAccessory) {
      return {
        marginRight: `${accessoryMinWidth}px`,
      };
    } else if (!startAccessory && endAccessory) {
      return {
        marginLeft: `${accessoryMinWidth}px`,
      };
    }
    return {};
  }, [accessoryMinWidth, startAccessory, endAccessory]);

  return (
    <Box
      className={classnames('mm-header-base', className)}
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.spaceBetween}
      {...props}
    >
      {startAccessory && (
        <Box
          className="mm-header-base__start-accessory"
          ref={startAccessoryRef}
          style={
            children
              ? {
                  minWidth: `${accessoryMinWidth}px`,
                }
              : undefined
          }
          {...startAccessoryWrapperProps}
        >
          {startAccessory}
        </Box>
      )}
      {children && (
        <Box
          className="mm-header-base__children"
          width={BLOCK_SIZES.FULL}
          style={getTitleStyles}
          {...childrenWrapperProps}
        >
          {children}
        </Box>
      )}
      {endAccessory && (
        <Box
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.flexEnd}
          className="mm-header-base__end-accessory"
          ref={endAccessoryRef}
          style={
            children
              ? {
                  minWidth: `${accessoryMinWidth}px`,
                }
              : undefined
          }
          {...endAccessoryWrapperProps}
        >
          {endAccessory}
        </Box>
      )}
    </Box>
  );
};
