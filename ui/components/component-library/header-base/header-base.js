import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  AlignItems,
  DISPLAY,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';
import { Text } from '../text';

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

  useEffect(() => {
    setAccessoryMinWidth(null);
  }, []);

  return (
    <Box
      className={classnames('mm-header-base', className)}
      display={DISPLAY.GRID}
      alignItems={AlignItems.flexStart}
      style={{
        gridTemplateColumns: `${accessoryMinWidth}px 1fr ${accessoryMinWidth}px`,
        background: 'blue',
      }}
      {...props}
    >
      {startAccessory && (
        <Box
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          className="mm-header-base__start-accessory"
          ref={startAccessoryRef}
          style={{
            background: 'red',
            width: 'max-content',
          }}
        >
          {startAccessory}
        </Box>
      )}
      {children && (
        <Text
          variant={TextVariant.headingSm}
          className="mm-header-base__title"
          textAlign={TEXT_ALIGN.CENTER}
          {...titleProps}
        >
          {children}
        </Text>
      )}
      {endAccessory && (
        <Box
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          marginLeft="auto"
          className="mm-header-base__end-accessory"
          ref={endAccessoryRef}
          style={{
            background: 'red',
            width: 'max-content',
          }}
        >
          {endAccessory}
        </Box>
      )}
    </Box>
  );
};

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

//   useEffect(() => {
//     function handleResize() {
//       console.log('this ran');
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

//     handleResize(); // call once on mount

//     window.addEventListener('resize', handleResize);

//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [startAccessoryRef, endAccessoryRef]);

//   function getLargerSize(item1, item2) {
//     const size1 = item1.scrollWidth;
//     const size2 = item2.scrollWidth;
//     const largerSize = size1 > size2 ? size1 : size2;
//     return largerSize;
//   }

//   return (
//     <Box
//       className={classnames('mm-header-base', className)}
//       display={DISPLAY.GRID}
//       alignItems={AlignItems.flexStart}
//       style={{
//         gridTemplateColumns: `${accessoryMinWidth}px 1fr ${accessoryMinWidth}px`,
//         background: 'blue',
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
//             background: 'red',
//             width: 'max-content',
//           }}
//         >
//           {startAccessory}
//         </Box>
//       )}
//       {children && (
//         <Text
//           variant={TextVariant.headingSm}
//           className="mm-header-base__title"
//           {...titleProps}
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
//             background: 'red',
//             width: 'max-content',
//           }}
//         >
//           {endAccessory}
//         </Box>
//       )}
//     </Box>
//   );
// };

// import React, { useRef, useEffect, useState } from 'react';
// import PropTypes from 'prop-types';
// import classnames from 'classnames';
// import {
//   AlignItems,
//   DISPLAY,
//   TextVariant,
// } from '../../../helpers/constants/design-system';
// import Box from '../../ui/box';
// import { Text } from '../text';

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

//   useEffect(() => {
//     console.log('this ran');
//     if (startAccessoryRef.current && endAccessoryRef.current) {
//       // Both startAccessoryRef and endAccessoryRef exist, so will find the larger of the two
//       const accMinWidth = getLargerSize(
//         startAccessoryRef.current,
//         endAccessoryRef.current,
//       );
//       setAccessoryMinWidth(accMinWidth);
//     } else if (startAccessoryRef.current && !endAccessoryRef.current) {
//       // Only startAccessoryRef exists
//       setAccessoryMinWidth(startAccessoryRef.current.scrollWidth);
//     } else if (!startAccessoryRef.current && endAccessoryRef.current) {
//       // Only endAccessoryRef exists
//       setAccessoryMinWidth(endAccessoryRef.current.scrollWidth);
//     } else {
//       // Neither startAccessoryRef nor endAccessoryRef exist
//       setAccessoryMinWidth(0);
//     }
//   }, [startAccessoryRef, endAccessoryRef]);

//   function getLargerSize(item1, item2) {
//     const size1 = item1.scrollWidth;
//     const size2 = item2.scrollWidth;
//     const largerSize = size1 > size2 ? size1 : size2;
//     return largerSize;
//   }

//   return (
//     <Box
//       className={classnames('mm-header-base', className)}
//       display={DISPLAY.GRID}
//       alignItems={AlignItems.flexStart}
//       style={{
//         gridTemplateColumns: `${accessoryMinWidth}px 1fr ${accessoryMinWidth}px`,
//         background: 'blue',
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
//             background: 'red',
//             width: 'max-content',
//           }}
//         >
//           {startAccessory}
//         </Box>
//       )}
//       {children && (
//         <Text
//           variant={TextVariant.headingSm}
//           className="mm-header-base__title"
//           {...titleProps}
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
//             background: 'red',
//             width: 'max-content',
//           }}
//         >
//           {endAccessory}
//         </Box>
//       )}
//     </Box>
//   );
// };

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
