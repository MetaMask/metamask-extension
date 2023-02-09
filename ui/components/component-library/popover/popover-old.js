// Build a popover component using react-popper
// https://popper.js.org/react-popper/v2/

// import React, { useState } from 'react';
// import { usePopper } from 'react-popper';
// import PropTypes from 'prop-types';
// import classnames from 'classnames';

// import { Button } from '../button';

// import Box from '../../ui/box';

// import {
//   AlignItems,
//   BorderRadius,
//   Color,
//   DISPLAY,
//   JustifyContent,
// } from '../../../helpers/constants/design-system';

// export const Popover = ({ children, className, ...props }) => {
//   const [referenceElement, setReferenceElement] = useState(null);
//   const [popperElement, setPopperElement] = useState(null);
//   const [arrowElement, setArrowElement] = useState(null);
//   const { styles, attributes } = usePopper(
//     referenceElement,
//     popperElement,
//     { placement: 'bottom' },
//     {
//       modifiers: [
//         { name: 'arrow', options: { element: arrowElement } },
//         {
//           name: 'offset',
//           options: {
//             offset: [0, 8],
//           },
//         },
//         {
//           name: 'preventOverflow',
//           options: {
//             mainAxis: false, // true by default
//             altAxis: false,
//           },
//         },
//         {
//           name: 'flip',
//           options: {
//             flipVariations: false, // true by default
//           },
//         },
//       ],
//     },
//   );
//   return (
//     <>
//       <div style={{ backgroundColor: 'red' }} ref={setReferenceElement}>
//         <Button>Popper Trigger</Button>
//       </div>
//       <Box
//         className={classnames('mm-popover tooltip', className)}
//         display={DISPLAY.INLINE_FLEX}
//         justifyContent={JustifyContent.center}
//         alignItems={AlignItems.center}
//         borderColor={Color.borderDefault}
//         backgroundColor={Color.backgroundDefault}
//         borderRadius={BorderRadius.XL}
//         padding={4}
//         {...props}
//         ref={setPopperElement}
//         style={styles.popper}
//         {...attributes.popper}
//       >
//         {children} - This is the popper content
//         <Box
//           borderColor={Color.borderDefault}
//           className={classnames('arrow')}
//           ref={setArrowElement}
//           style={styles.arrow}
//           {...attributes.arrow}
//         />
//       </Box>
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

// import React, { useState } from 'react';
// import { usePopper } from 'react-popper';
// import PropTypes from 'prop-types';
// import classnames from 'classnames';

// import Box from '../../ui/box';
// import { Button } from '../button';

// import {
//   AlignItems,
//   BorderRadius,
//   Color,
//   DISPLAY,
//   JustifyContent,
// } from '../../../helpers/constants/design-system';

// export const Popover = (className, children, ...props) => {
//   const [referenceElement, setReferenceElement] = useState(null);
//   const [popperElement, setPopperElement] = useState(null);
//   const [arrowElement, setArrowElement] = useState(null);
//   const { styles, attributes } = usePopper(referenceElement, popperElement, {
//     placement: 'auto',
//     modifiers: [
//       { name: 'arrow', options: { element: arrowElement } },
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
//       <div style={{ backgroundColor: 'red' }} ref={setReferenceElement}>
//         <Button>Popper Trigger</Button>
//       </div>

//       <Box
//         className={classnames('mm-popover tooltip', className)}
//         display={DISPLAY.INLINE_FLEX}
//         justifyContent={JustifyContent.center}
//         AlignItems={AlignItems.center}
//         borderColor={Color.borderDefault}
//         backgroundColor={Color.backgroundDefault}
//         BorderRadius={BorderRadius.xl}
//         padding={4}
//         {...props}
//         ref={setPopperElement}
//         style={styles.popper}
//         {...attributes.popper}
//       >
//         {children} - This is the popper content
//         <Box
//           borderColor={Color.borderDefault}
//           className={classnames('arrow')}
//           ref={setArrowElement}
//           style={styles.arrow}
//           {...attributes.arrow}
//         />
//       </Box>
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
