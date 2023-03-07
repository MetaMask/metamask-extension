import React, { useRef, useEffect, useState } from 'react';
import { AlignItems, DISPLAY } from '../../../helpers/constants/design-system';
import Box from '../../ui/box';
import { Button } from '..';

export const HeaderBase = ({
  startAccessory,
  endAccessory,
  className,
  title,
}) => {
  const startAccessory = useRef();
  const endAccessory = useRef();
  const [accessoryMinWidth, setAccessoryMinWidth] = useState();

  useEffect(() => {
    if (startAccessory.current && endAccessory.current) {
      // Both startAccessory and endAccessory exist, so will find the larger of the two
      const accMinWidth = getLargerSize(
        startAccessory.current,
        endAccessory.current,
      );
      setAccessoryMinWidth(accMinWidth);
    } else if (startAccessory.current && !endAccessory.current) {
      // Only startAccessory exists
      setAccessoryMinWidth(startAccessory.current.scrollWidth);
    } else if (!startAccessory.current && endAccessory.current) {
      // Only endAccessory exists
      setAccessoryMinWidth(endAccessory.current.scrollWidth);
    } else {
      // Neither startAccessory nor endAccessory exist
      setAccessoryMinWidth(0);
    }
  }, [startAccessory, endAccessory]);

  function getLargerSize(item1, item2) {
    const size1 = item1.scrollWidth;
    const size2 = item2.scrollWidth;
    const largerSize = size1 > size2 ? size1 : size2;
    return largerSize;
  }

  return (
    <Box
      className="mm-header-base"
      display={DISPLAY.GRID}
      alignItems={AlignItems.center}
      style={{
        gridTemplateColumns: `${accessoryMinWidth}px 1fr ${accessoryMinWidth}px`,
        background: 'blue',
      }}
    >
      <div
        className="item-1"
        ref={startAccessory}
        style={{
          background: 'red',
          width: 'max-content',
        }}
      >
        <div>Item 1 jhhel</div>
      </div>
      <div
        className="item-2"
        style={{ width: '100%', textAlign: 'center', background: 'pink' }}
      >
        Item 2 this is an extremely long title right here to test how well this
        works out
      </div>
      <div
        className="item-3"
        ref={endAccessory}
        style={{
          background: 'green',
          width: 'max-content',
        }}
      >
        <Button>Hello World</Button>
      </div>
    </Box>
  );
};

// import React from 'react';
// import PropTypes from 'prop-types';
// import classnames from 'classnames';

// import { ButtonIcon, ButtonLink, ICON_NAMES, Text } from '..';

// import Box from '../../ui/box';

// import {
//   BackgroundColor,
//   BorderRadius,
//   DISPLAY,
//   Size,
//   TextVariant,
// } from '../../../helpers/constants/design-system';

// export const HeaderBase = ({
//   className,
//   title,
//   titleProps,
//   description,
//   descriptionProps,
//   children,
//   actionButtonLabel,
//   actionButtonOnClick,
//   actionButtonProps,
//   startAccessory,
//   onClose,
//   closeButtonProps,
//   ...props
// }) => {
//   return (
//     <Box
//       className={classnames('mm-header-base', className)}
//       display={DISPLAY.FLEX}
//       gap={2}
//       backgroundColor={BackgroundColor.backgroundDefault}
//       borderRadius={BorderRadius.SM}
//       padding={3}
//       {...props}
//     >
//       {startAccessory && <>{startAccessory}</>}

//       <div>
//         {title && (
//           <Text
//             className="mm-header-base__title"
//             variant={TextVariant.bodyLgMedium}
//             as="h5"
//             {...titleProps}
//           >
//             {title}
//           </Text>
//         )}
//         {description && <Text {...descriptionProps}>{description}</Text>}
//         {children && typeof children === 'object' ? (
//           children
//         ) : (
//           <Text>{children}</Text>
//         )}
//         {actionButtonLabel && (
//           <ButtonLink
//             size={Size.auto}
//             onClick={actionButtonOnClick}
//             {...actionButtonProps}
//           >
//             {actionButtonLabel}
//           </ButtonLink>
//         )}
//       </div>
//       {onClose && (
//         <ButtonIcon
//           className="mm-header-base__close-button"
//           marginLeft="auto"
//           iconName={ICON_NAMES.CLOSE}
//           size={Size.SM}
//           ariaLabel="Close" // TODO: i18n
//           onClick={onClose}
//           {...closeButtonProps}
//         />
//       )}
//     </Box>
//   );
// };

// HeaderBase.propTypes = {
//   /**
//    * The title of the HeaderBase
//    */
//   title: PropTypes.string,
//   /**
//    * Additional props to pass to the `Text` component used for the `title` text
//    */
//   titleProps: PropTypes.shape(Text.PropTypes),
//   /**
//    * The children is an alternative to using the description prop for HeaderBase content below the title
//    */
//   children: PropTypes.node,
//   /**
//    * The start(defualt left) content area of HeaderBase
//    */
//   startAccessory: PropTypes.node,
//   /**
//    * An additional className to apply to the HeaderBase
//    */
//   className: PropTypes.string,
//   /**
//    * HeaderBase accepts all the props from Box
//    */
//   ...Box.propTypes,
// };
