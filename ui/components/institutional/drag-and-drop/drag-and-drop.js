import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
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
    div.addEventListener('dragenter', handleDragIn);
    div.addEventListener('dragleave', handleDragOut);
    div.addEventListener('dragover', handleDrag);
    div.addEventListener('drop', handleDrop);
    return () => {
      const div = dropRef.current;
      div.removeEventListener('dragenter', handleDragIn);
      div.removeEventListener('dragleave', handleDragOut);
      div.removeEventListener('dragover', handleDrag);
      div.removeEventListener('drop', handleDrop);
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
        <div className="drag-and-drop__overlay">
          <div className="drag-and-drop__text-container">
            <Text>{t('DropJwtHere')}</Text>
          </div>
        </div>
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
