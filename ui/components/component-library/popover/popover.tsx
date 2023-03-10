import React, { useState, forwardRef, useImperativeHandle, Ref } from 'react';
import { createPortal } from 'react-dom';
// import PropTypes from 'prop-types';
import { usePopper, Placement } from 'react-popper';
import classnames from 'classnames';
import {
  AlignItems,
  BorderRadius,
  Color,
  DISPLAY,
  JustifyContent,
  Size,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import Box, { BoxProps } from '../../ui/box/box';
import { ButtonIcon, ICON_NAMES, Text } from '..';

type PopoverPosition = Placement;

export interface PopoverProps extends Omit<BoxProps, 'title'> {
  title?: string;
  children?: React.ReactNode;
  position?: PopoverPosition;
  hasArrow?: boolean;
  matchWidth?: boolean;
  preventOverflow?: boolean;
  flip?: boolean;
  referenceElement?: HTMLElement | null;
  isOpen?: boolean;
  onClose?: () => void;
  closeButtonProps?: ButtonIconProps;
  onBack?: () => void;
  backButtonProps?: ButtonIconProps;
}

interface PopoverRef {
  closePopover: () => void;
}

export const Popover = forwardRef<PopoverRef, PopoverProps>(
  (
    {
      children,
      className,
      position = 'auto',
      hasArrow = false,
      matchWidth,
      preventOverflow = false,
      flip = false,
      referenceElement,
      isOpen,
      title,
      onClose,
      closeButtonProps,
      onBack,
      backButtonProps,
      ...props
    }: PopoverProps,
    ref: Ref<PopoverRef>,
  ) => {
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(
      null,
    );
    const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);

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
              {...props}
            >
              <Box
                className="popover__header"
                paddingLeft={onBack || onClose ? 8 : 0}
                paddingRight={onBack || onClose ? 8 : 0}
              >
                {onBack && (
                  <ButtonIcon
                    iconName={ICON_NAMES.ARROW_LEFT}
                    className="popover__header-button-back"
                    size={Size.SM}
                    ariaLabel="back"
                    onClick={onBack}
                    {...backButtonProps}
                  />
                )}

                <Text
                  variant={TextVariant.headingSm}
                  className="popover__header-title"
                  textAlign={TEXT_ALIGN.CENTER}
                >
                  {title}
                </Text>

                {onClose && (
                  <ButtonIcon
                    iconName={ICON_NAMES.CLOSE}
                    className="popover__header-button-close"
                    size={Size.SM}
                    ariaLabel="close"
                    onClick={onClose}
                    {...closeButtonProps}
                  />
                )}
              </Box>
              {children}
              {hasArrow && (
                <Box
                  borderColor={Color.borderDefault}
                  className={classnames('arrow')}
                  ref={setArrowElement}
                  display={DISPLAY.FLEX}
                  justifyContent={JustifyContent.center}
                  alignItems={AlignItems.center}
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

// import React, { useState, forwardRef, useImperativeHandle } from 'react';
// import { createPortal } from 'react-dom';
// import { PropTypes } from 'prop-types';
// import { usePopper } from 'react-popper';
// import classnames from 'classnames';
// import {
//   AlignItems,
//   BorderRadius,
//   Color,
//   DISPLAY,
//   JustifyContent,
//   Size,
//   TextVariant,
//   TEXT_ALIGN,
// } from '../../../helpers/constants/design-system';
// import Box from '../../ui/box/box';
// import { ButtonIcon, ICON_NAMES, Text } from '..';
// import { PopoverPosition } from '.';

// export const Popover = forwardRef(
//   (
//     {
//       title,
//       children,
//       position = PopoverPosition.auto,
//       hasArrow = false,
//       matchWidth,
//       preventOverflow = false,
//       flip = false,
//       className,
//       referenceElement,
//       isOpen,
//       onClose,
//       closeButtonProps,
//       onBack,
//       backButtonProps,
//       ...props
//     },
//     ref,
//   ) => {
//     const [popperElement, setPopperElement] = useState(null);
//     const [arrowElement, setArrowElement] = useState(null);

//     // Define Popper options
//     const { styles, attributes } = usePopper(referenceElement, popperElement, {
//       placement: position,
//       modifiers: [
//         {
//           name: 'preventOverflow',
//           enabled: position === 'auto' ? true : preventOverflow,
//         },
//         {
//           name: 'flip',
//           enabled: position === 'auto' ? true : flip,
//         },
//         {
//           name: 'arrow',
//           enabled: hasArrow,
//           options: {
//             element: arrowElement,
//           },
//         },
//         {
//           name: 'offset',
//           options: {
//             offset: [0, 8],
//           },
//         },
//       ],
//     });

//     // Define width to match reference element or auto
//     const contentStyle = {
//       width: matchWidth ? referenceElement?.clientWidth : 'auto',
//     };

//     // Forwarding function to close the popover using the ref
//     useImperativeHandle(ref, () => ({
//       closePopover: () => {
//         // Your close popover implementation here
//       },
//     }));

//     return (
//       <>
//         {isOpen &&
//           createPortal(
//             <Box
//               borderColor={Color.borderDefault}
//               borderRadius={BorderRadius.XL}
//               backgroundColor={Color.backgroundDefault}
//               padding={4}
//               className={classnames(
//                 'popover',
//                 { 'popover--open': isOpen },
//                 className,
//               )}
//               ref={setPopperElement}
//               style={{ ...styles.popper, ...contentStyle }}
//               {...attributes.popper}
//               {...props}
//             >
//               <Box
//                 className="popover__header"
//                 paddingLeft={onBack || onClose ? 8 : 0}
//                 paddingRight={onBack || onClose ? 8 : 0}
//               >
//                 {onBack && (
//                   <ButtonIcon
//                     iconName={ICON_NAMES.ARROW_LEFT}
//                     className="popover__header-button-back"
//                     size={Size.SM}
//                     ariaLabel="back"
//                     onClick={onBack}
//                     {...backButtonProps}
//                   />
//                 )}

//                 <Text
//                   variant={TextVariant.headingSm}
//                   className="popover__header-title"
//                   textAlign={TEXT_ALIGN.CENTER}
//                 >
//                   {title}
//                 </Text>

//                 {onClose && (
//                   <ButtonIcon
//                     iconName={ICON_NAMES.CLOSE}
//                     className="popover__header-button-close"
//                     size={Size.SM}
//                     ariaLabel="close"
//                     onClick={onClose}
//                     {...closeButtonProps}
//                   />
//                 )}
//               </Box>
//               {children}
//               {hasArrow && (
//                 <Box
//                   borderColor={Color.borderDefault}
//                   className={classnames('arrow')}
//                   ref={setArrowElement}
//                   display={DISPLAY.FLEX}
//                   justifyContent={JustifyContent.center}
//                   alignItems={AlignItems.center}
//                   style={styles.arrow}
//                   {...attributes.arrow}
//                 />
//               )}
//             </Box>,
//             document.body,
//           )}
//       </>
//     );
//   },
// );

// Popover.propTypes = {
//   // position: PropTypes.oneOf(PopoverPosition),
//   hasArrow: PropTypes.bool,
//   matchWidth: PropTypes.bool,
//   preventOverflow: PropTypes.bool,
//   flip: PropTypes.bool,
//   referenceElement: PropTypes.object,
//   isOpen: PropTypes.bool,
//   onClose: PropTypes.func,
//   closeButtonProps: PropTypes.shape(ButtonIcon.PropTypes),
//   onBack: PropTypes.func,
//   backButtonProps: PropTypes.shape(ButtonIcon.PropTypes),
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

// Popover.displayName = 'Popover';
