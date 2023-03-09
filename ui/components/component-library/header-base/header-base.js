import React, { useRef, useLayoutEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  BLOCK_SIZES,
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';

export const HeaderBase = ({
  startAccessory,
  endAccessory,
  className,
  children,
  childrenWrapperProps,
  startAccessoryWrapperProps,
  endAccessoryWrapperProps,
  ...props
}) => {
  const startAccessoryRef = useRef();
  const endAccessoryRef = useRef();
  const [accessoryMinWidth, setAccessoryMinWidth] = useState();

  useLayoutEffect(() => {
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
            children && {
              minWidth: `${accessoryMinWidth}px`,
            }
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
            children && {
              minWidth: `${accessoryMinWidth}px`,
            }
          }
          {...endAccessoryWrapperProps}
        >
          {endAccessory}
        </Box>
      )}
    </Box>
  );
};

HeaderBase.propTypes = {
  /**
   * The children is the title area of the HeaderBase
   */
  children: PropTypes.node,
  /**
   * Additional props to pass to the `Box` component wrapped around the children
   */
  childrenWrapperProps: PropTypes.shape(Box.PropTypes),
  /**
   * The start(defualt left) content area of HeaderBase
   */
  startAccessory: PropTypes.node,
  /**
   * Additional props to pass to the `Box` component wrapped around the startAccessory
   */
  startAccessoryWrapperProps: PropTypes.shape(Box.PropTypes),
  /**
   * The end (defualt right) content area of HeaderBase
   */
  endAccessory: PropTypes.node,
  /**
   * Additional props to pass to the `Box` component wrapped around the endAccessory
   */
  endAccessoryWrapperProps: PropTypes.shape(Box.PropTypes),
  /**
   * An additional className to apply to the HeaderBase
   */
  className: PropTypes.string,
  /**
   * HeaderBase accepts all the props from Box
   */
  ...Box.propTypes,
};
