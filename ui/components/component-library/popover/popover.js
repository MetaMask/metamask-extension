import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import classnames from 'classnames';
import { useClickAway } from '../../../hooks/useClickAway';
import { useElementSize } from '../../../hooks/useElementSize';
import {
  AlignItems,
  BorderRadius,
  Color,
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Button } from '../button';
import Box from '../../ui/box';

const useValueRef = (newValue) => {
  const ref = useRef(newValue);

  useEffect(() => {
    ref.current = newValue;
  }, [newValue]);

  return ref;
};

export const Popover = (props) => {
  const {
    // eslint-disable-next-line react/prop-types
    // need to decide if we want the anchor element to be wrapped and based as children or to make dev pass a ref to the anchor
    anchor,
    // eslint-disable-next-line react/prop-types
    children,
    // eslint-disable-next-line react/prop-types
    onClickOutside,
    // eslint-disable-next-line react/prop-types
    placement = 'auto',
    // eslint-disable-next-line react/prop-types
    distance = 4,
    // eslint-disable-next-line react/prop-types
    enableScreenCover = false,
    // eslint-disable-next-line react/prop-types
    className,
  } = props;

  const [popperElement, setPopperElement] = useState(null);
  const [referenceElement, setReferenceElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);

  const { styles, attributes, update } = usePopper(
    referenceElement,
    popperElement,
    {
      placement,
      strategy: 'fixed',
      modifiers: [
        { name: 'arrow', options: { element: arrowElement } },
        {
          name: 'offset',
          options: {
            offset: [0, distance],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            padding: 8,
          },
        },
      ],
    },
  );

  const popperRef = useValueRef(popperElement);

  useClickAway(popperRef, (event) => {
    // eslint-disable-next-line react/prop-types
    if (referenceElement.contains(event.target)) {
      return;
    }
    if (onClickOutside) {
      onClickOutside();
    }
  });

  const size = useElementSize(popperElement);

  useEffect(() => {
    if (!update) {
      return;
    }
    update();
  }, [size, update]);

  const popoverNode = (
    <Box
      className={classnames('mm-popover tooltip', className)}
      display={DISPLAY.INLINE_FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      borderColor={Color.borderDefault}
      backgroundColor={Color.backgroundDefault}
      borderRadius={BorderRadius.XL}
      padding={4}
      {...props}
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      {children} - This is the popper content
      <Box
        borderColor={Color.borderDefault}
        className={classnames('arrow')}
        ref={setArrowElement}
        style={styles.arrow}
        {...attributes.arrow}
      />
    </Box>
  );

  return (
    <div>
      <div style={{ backgroundColor: 'red' }} ref={setReferenceElement}>
        <Button>Popper Trigger</Button>
      </div>
      {createPortal(
        <div>
          {enableScreenCover && (
            <div>
              <h1>scrim</h1>
            </div>
          )}
          {popoverNode}
        </div>,
        document.body,
      )}
    </div>
  );
};
