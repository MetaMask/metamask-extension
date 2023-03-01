import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { PropTypes } from 'prop-types';
import { usePopper } from 'react-popper';
import classnames from 'classnames';
import {
  AlignItems,
  BorderRadius,
  Color,
  DISPLAY,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ButtonIcon, ICON_NAMES, Text } from '..';
import { PopoverPosition } from '.';

export const Popover = forwardRef(
  (
    {
      children,
      position = PopoverPosition.bottomStart,
      hasArrow = true,
      matchWidth = false,
      preventOverflow = false,
      flip = true,
      className,
      referenceElement,
      isOpen,
      onClose,
      closeButtonProps,
      onBack,
      backButtonProps,
      ...props
    },
    ref,
  ) => {
    const [popperElement, setPopperElement] = useState(null);
    const [arrowElement, setArrowElement] = useState(null);

    // Define Popper options
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
      placement: position,
      modifiers: [
        {
          name: 'preventOverflow',
          enabled: position === 'auto' ? true : preventOverflow,
        },
        {
          name: 'flip',
          enabled: position === 'auto' ? true : flip,
        },
        {
          name: 'arrow',
          enabled: hasArrow,
          options: {
            element: arrowElement,
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    });

    // Define width to match reference element or auto
    const contentStyle = {
      width: matchWidth ? referenceElement?.clientWidth : 'auto',
    };

    // Forwarding function to close the popover using the ref
    useImperativeHandle(ref, () => ({
      closePopover: () => {
        // Your close popover implementation here
      },
    }));

    return (
      <>
        {isOpen &&
          createPortal(
            <Box
              borderColor={Color.borderDefault}
              borderRadius={BorderRadius.XL}
              backgroundColor={Color.backgroundDefault}
              padding={4}
              className={classnames(
                'popover',
                { 'popover--open': isOpen },
                className,
              )}
              ref={setPopperElement}
              style={{ ...styles.popper, ...contentStyle }}
              {...attributes.popper}
            >
              <Box
                display={DISPLAY.FLEX}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.spaceBetween}
                className="popover__header"
              >
                <Box className="popover__header-item-start">
                  <ButtonIcon
                    iconName={ICON_NAMES.ARROW_LEFT}
                    size={Size.SM}
                    ariaLabel="back"
                  />
                </Box>
                <Text className="popover__header-item-middle">
                  Title goes here
                </Text>
                <Box className="popover__header-item-end">
                  <ButtonIcon
                    iconName={ICON_NAMES.CLOSE}
                    size={Size.SM}
                    ariaLabel="close"
                  />
                </Box>
              </Box>
              {children}
              {hasArrow && (
                <Box
                  borderColor={Color.borderDefault}
                  className={classnames('arrow')}
                  ref={setArrowElement}
                  style={styles.arrow}
                  {...attributes.arrow}
                />
              )}
            </Box>,
            document.body,
          )}
      </>
    );
  },
);

Popover.propTypes = {
  /**
   * The children to be rendered inside the Popover
   */
  children: PropTypes.node,
  /**
   * An additional className to apply to the Popover.
   */
  className: PropTypes.string,
  /**
   * Popover accepts all the props from Box
   */
  ...Box.propTypes,
};

Popover.displayName = 'Popover';

// // add ESC button option to close popover (boolean)

// import React, { useState } from 'react';
// import { createPortal } from 'react-dom';
// import { PropTypes } from 'prop-types';
// import { usePopper } from 'react-popper';
// import classnames from 'classnames';
// import { BorderRadius, Color } from '../../../helpers/constants/design-system';
// import Box from '../../ui/box/box';
// import { PopoverPosition } from '.';

// export const Popover = ({
//   children,
//   // content,
//   position = PopoverPosition.bottomStart,
//   hasArrow = true,
//   matchWidth = false,
//   preventOverflow = false,
//   flip = true,
//   className,
//   referenceElement,
//   isOpen,
//   ...props
// }) => {
//   const [popperElement, setPopperElement] = useState(null);
//   const [arrowElement, setArrowElement] = useState(null);
//   // Define Popper options
//   const { styles, attributes } = usePopper(referenceElement, popperElement, {
//     placement: position,
//     modifiers: [
//       {
//         name: 'preventOverflow',
//         enabled: position === 'auto' ? true : preventOverflow,
//       },
//       {
//         name: 'flip',
//         enabled: position === 'auto' ? true : flip,
//       },
//       {
//         name: 'arrow',
//         enabled: hasArrow,
//         options: {
//           element: arrowElement,
//         },
//       },
//       {
//         name: 'offset',
//         options: {
//           offset: [0, 8],
//         },
//       },
//     ],
//   });
//   // Define width to match reference element or auto
//   const contentStyle = {
//     width: matchWidth ? referenceElement?.clientWidth : 'auto',
//   };

//   return (
//     <>
//       {/* <Box
//         className="popover-reference"
//         backgroundColor={Color.primaryDefault}
//         padding={5}
//       >
//         {children}
//       </Box> */}
//       {isOpen &&
//         createPortal(
//           <Box
//             borderColor={Color.borderDefault}
//             borderRadius={BorderRadius.XL}
//             backgroundColor={Color.backgroundDefault}
//             padding={4}
//             className={classnames('popover', { 'popover--open': isOpen })}
//             ref={setPopperElement}
//             style={{ ...styles.popper, ...contentStyle }}
//             {...attributes.popper}
//           >
//             {children} - This is the popper content{' '}
//             {console.log('children', children)}
//             {hasArrow && (
//               <Box
//                 borderColor={Color.borderDefault}
//                 className={classnames('arrow')}
//                 ref={setArrowElement}
//                 style={styles.arrow}
//                 {...attributes.arrow}
//               />
//             )}
//           </Box>,
//           document.body,
//         )}
//     </>
//   );
// };

// Popover.propTypes = {
//   /**
//    * The children to be rendered inside the Popover
//    */
//   children: PropTypes.node,
//   /**
//    * An additional className to apply to the Popover.
//    */
//   className: PropTypes.string,
//   /**
//    * Popover accepts all the props from Box
//    */
//   ...Box.propTypes,
// };
