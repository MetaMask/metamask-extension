import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  // AlignItems,
  DISPLAY,
  JustifyContent,
  TextVariant,
  TEXT_ALIGN,
  // FLEX_WRAP,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';
import { Text } from '../text';

// export const HeaderBase = ({
//   startAccessory,
//   endAccessory,
//   className,
//   children,
//   titleProps,
//   ...props
// }) => {
//   const startAccessoryRef = useRef();
//   const endAccessoryRef = useRef();
//   const [accessoryMinWidth, setAccessoryMinWidth] = useState();

//   function getLargerSize(item1, item2) {
//     const size1 = item1.scrollWidth;
//     const size2 = item2.scrollWidth;
//     const largerSize = size1 > size2 ? size1 : size2;
//     return largerSize;
//   }

//   useEffect(() => {
//     function handleResize() {
//       if (startAccessoryRef.current && endAccessoryRef.current) {
//         // Both startAccessoryRef and endAccessoryRef exist, so will find the larger of the two
//         const accMinWidth = getLargerSize(
//           startAccessoryRef.current,
//           endAccessoryRef.current,
//         );
//         setAccessoryMinWidth(accMinWidth);
//       } else if (startAccessoryRef.current && !endAccessoryRef.current) {
//         // Only startAccessoryRef exists
//         setAccessoryMinWidth(startAccessoryRef.current.scrollWidth);
//       } else if (!startAccessoryRef.current && endAccessoryRef.current) {
//         // Only endAccessoryRef exists
//         setAccessoryMinWidth(endAccessoryRef.current.scrollWidth);
//       } else {
//         // Neither startAccessoryRef nor endAccessoryRef exist
//         setAccessoryMinWidth(0);
//       }
//     }

//     handleResize();
//     window.addEventListener('resize', handleResize);

//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [startAccessoryRef, endAccessoryRef]);

//   return (
//     <Box
//       className={classnames('mm-header-base', className)}
//       // display={DISPLAY.GRID}
//       alignItems={AlignItems.flexStart}
//       style={{
//         display: 'grid',
//         gridTemplateColumns: `${accessoryMinWidth}px 1fr ${accessoryMinWidth}px`,
//       }}
//       {...props}
//     >
//       {startAccessory && (
//         <Box
//           display={DISPLAY.FLEX}
//           alignItems={AlignItems.center}
//           className="mm-header-base__start-accessory"
//           ref={startAccessoryRef}
//           style={{
//             width: 'max-content',
//             gridColumn: 1,
//           }}
//         >
//           {startAccessory}
//         </Box>
//       )}
//       {children && (
//         <Text
//           variant={TextVariant.headingSm}
//           className="mm-header-base__title"
//           textAlign={TEXT_ALIGN.CENTER}
//           {...titleProps}
//           style={{
//             gridColumn: 2,
//           }}
//         >
//           {children}
//         </Text>
//       )}
//       {endAccessory && (
//         <Box
//           display={DISPLAY.FLEX}
//           alignItems={AlignItems.center}
//           marginLeft="auto"
//           className="mm-header-base__end-accessory"
//           ref={endAccessoryRef}
//           style={{
//             width: 'max-content',
//             gridColumn: 3,
//           }}
//         >
//           {endAccessory}
//         </Box>
//       )}
//     </Box>
//   );
// };

export const HeaderBase = ({
  startAccessory,
  endAccessory,
  className,
  children,
  titleProps,
  ...props
}) => {
  const startAccessoryRef = useRef();
  const endAccessoryRef = useRef();
  const [accessoryMinWidth, setAccessoryMinWidth] = useState();

  function getLargerSize(item1, item2) {
    const size1 = item1.scrollWidth;
    const size2 = item2.scrollWidth;
    const largerSize = size1 > size2 ? size1 : size2;
    return largerSize;
  }

  useEffect(() => {
    function handleResize() {
      if (startAccessoryRef.current && endAccessoryRef.current) {
        // Both startAccessoryRef and endAccessoryRef exist, so will find the larger of the two
        const accMinWidth = getLargerSize(
          startAccessoryRef.current,
          endAccessoryRef.current,
        );
        setAccessoryMinWidth(accMinWidth);
      } else if (startAccessoryRef.current && !endAccessoryRef.current) {
        // Only startAccessoryRef exists
        setAccessoryMinWidth(startAccessoryRef.current.scrollWidth);
      } else if (!startAccessoryRef.current && endAccessoryRef.current) {
        // Only endAccessoryRef exists
        setAccessoryMinWidth(endAccessoryRef.current.scrollWidth);
      } else {
        // Neither startAccessoryRef nor endAccessoryRef exist
        setAccessoryMinWidth(0);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [startAccessoryRef, endAccessoryRef]);

  function getTitleStyles() {
    if (startAccessory && endAccessory) {
      return {
        width: '100%',
        backgroundColor: 'gold',
      };
    } else if (startAccessory && !endAccessory) {
      return {
        width: '100%',
        marginRight: `${accessoryMinWidth}px`,
        backgroundColor: 'green',
      };
    } else if (!startAccessory && endAccessory) {
      return {
        width: '100%',
        marginLeft: `${accessoryMinWidth}px`,
        backgroundColor: 'red',
      };
    }
    return {
      width: '100%',
      backgroundColor: 'pink',
    };
  }

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
          style={{
            minWidth: `${accessoryMinWidth}px`,
          }}
        >
          {startAccessory}
        </Box>
      )}
      {children && (
        <Box
          style={getTitleStyles()}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
        >
          <Text
            variant={TextVariant.headingSm}
            className="mm-header-base__title"
            textAlign={TEXT_ALIGN.CENTER}
            {...titleProps}
          >
            {children}
          </Text>
        </Box>
      )}
      {endAccessory && (
        <Box
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.flexEnd}
          className="mm-header-base__end-accessory"
          ref={endAccessoryRef}
          style={{
            minWidth: `${accessoryMinWidth}px`,
          }}
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
   * Additional props to pass to the `Text` component used for the children (title) text
   */
  titleProps: PropTypes.shape(Text.PropTypes),
  /**
   * The start(defualt left) content area of HeaderBase
   */
  startAccessory: PropTypes.node,
  /**
   * The end (defualt right) content area of HeaderBase
   */
  endAccessory: PropTypes.node,
  /**
   * An additional className to apply to the HeaderBase
   */
  className: PropTypes.string,
  /**
   * HeaderBase accepts all the props from Box
   */
  ...Box.propTypes,
};
