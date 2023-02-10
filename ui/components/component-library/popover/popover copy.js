import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import classnames from 'classnames';
import Box from '../../ui/box';

import { Button } from '../button';

import { Color } from '../../../helpers/constants/design-system';
// export const Portal = ({ children }) => {
//   return createPortal(children, document.body);
// };

// export const Popover = React.forwardRef(function Popover(
//   { children, className, ...props },
//   ref,
// ) {
//   const [referenceElement, setReferenceElement] = useState(null);
//   const [popperElement, setPopperElement] = useState(null);
//   const [arrowElement, setArrowElement] = useState(null);
//   const { styles, attributes } = usePopper(referenceElement, popperElement, {
//     placement: 'bottom-start',
//     modifiers: [
//       { name: 'arrow', options: { element: arrowElement } },
//       {
//         name: 'flip',
//         options: {
//           fallbackPlacements: ['bottom-end'],
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

//   return (
//     <>
//       <div ref={setReferenceElement}>
//         <Button onClick={() => setPopperElement((prev) => !prev)}>
//           {children}
//         </Button>
//       </div>
//       {popperElement &&
//         createPortal(
//           <Box
//             borderColor={Color.borderDefault}
//             className={classnames('popover')}
//             ref={setPopperElement}
//             style={styles.popper}
//             {...attributes.popper}
//           >
//             {children} - This is the popper content
//             <Box
//               borderColor={Color.borderDefault}
//               className={classnames('arrow')}
//               ref={setArrowElement}
//               style={styles.arrow}
//               {...attributes.arrow}
//             />
//           </Box>,
//           document.body,
//         )}
//     </>
//   );
// });

export const Popover = ({ children, className, ...props }) => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
    modifiers: [
      { name: 'arrow', options: { element: arrowElement } },
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
  });

  return (
    <>
      <div ref={setReferenceElement}>
        <Button onClick={() => setIsOpen(!isOpen)}>{children}</Button>
      </div>
      {
        // popperElement &&
        createPortal(
          <Box
            borderColor={Color.borderDefault}
            className={classnames('popover', { 'popover--open': isOpen })}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            {children} - This is the popper content
            {console.log('popper element', popperElement)}
            <Box
              borderColor={Color.borderDefault}
              className={classnames('arrow')}
              ref={setArrowElement}
              style={styles.arrow}
              {...attributes.arrow}
            />
          </Box>,
          document.body,
        )
      }
    </>
  );
};

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
