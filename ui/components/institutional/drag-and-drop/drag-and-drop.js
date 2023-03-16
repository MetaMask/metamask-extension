import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BorderStyle,
  BorderColor,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';
import { Text } from '../../component-library';

const DragAndDrop = (props) => {
  const t = useI18nContext();
  const [dragging, setDragging] = useState(false);
  const dropRef = useRef(React.createRef());
  const dragCounter = useRef();

  useEffect(() => {
    dragCounter.current = 0;
    const div = dropRef.current;
    div.current.addEventListener('dragenter', handleDragIn);
    div.current.addEventListener('dragleave', handleDragOut);
    div.current.addEventListener('dragover', handleDrag);
    div.current.addEventListener('drop', handleDrop);
    return () => {
      const div = dropRef.current;
      div.current.removeEventListener('dragenter', handleDragIn);
      div.current.removeEventListener('dragleave', handleDragOut);
      div.current.removeEventListener('dragover', handleDrag);
      div.current.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleDrag = useCallback(() => {
    e.preventDefault();
    e.stopPropagation();
  });

  const handleDragIn = useCallback(() => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  });

  const handleDragOut = useCallback(() => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;

    if (dragCounter.current === 0) {
      setDragging(false);
    }
  });

  const handleDrop = useCallback(() => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      props.handleDrop(e.dataTransfer.files);
      e.dataTransfer.clearData();
      dragCounter.current = 0;
    }
  });

  return (
    <Box
      className={classnames('drag-and-drop__container', props.className)}
      ref={dropRef.current}
    >
      {dragging && (
        <Box
          className="drag-and-drop__overlay"
          borderStyle={BorderStyle.dashed}
          borderColor={BorderColor.borderDefault}
          backgroundColor={BackgroundColor.backgroundDefault}
        >
          <Box
            className="drag-and-drop__text-container"
            color={TextColor.textDefault}
          >
            <Text>{t('DropJwtHere')}</Text>
          </Box>
        </Box>
      )}
      {props.children}
    </Box>
  );
};

DragAndDrop.propTypes = {
  handleDrop: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default DragAndDrop;
