import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { DragSource, DropTarget } from 'react-dnd'

class DraggableSeed extends Component {

  static propTypes = {
    // React DnD Props
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    removePending: PropTypes.func.isRequired,
    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,
    // Own Props
    onClick: PropTypes.func.isRequired,
    index: PropTypes.number,
    draggingSeedIndex: PropTypes.number,
    word: PropTypes.string,
    className: PropTypes.string,
    selected: PropTypes.bool,
    droppable: PropTypes.bool,
  }

  static defaultProps = {
    className: '',
    onClick () {},
    removePending () {},
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const { isOver, draggingSeedIndex, removePending } = this.props
    if (isOver && !nextProps.isOver) {
      removePending(draggingSeedIndex)
    }
  }

  render () {
    const {
      connectDragSource,
      connectDropTarget,
      isDragging,
      index,
      word,
      selected,
      className,
      onClick,
      droppable,
      isOver,
      canDrop,
    } = this.props

    return connectDropTarget(connectDragSource(
      <div
        key={index}
        className={classnames('confirm-seed-phrase__seed-word', className, {
          'confirm-seed-phrase__seed-word--selected': selected,
          'confirm-seed-phrase__seed-word--dragging': isDragging,
          'confirm-seed-phrase__seed-word--empty': droppable && !word,
          'confirm-seed-phrase__seed-word--active-drop': !isOver && canDrop,
          'confirm-seed-phrase__seed-word--drop-hover': isOver && canDrop,
        })}
        onClick={onClick}
      >
        { word }
      </div>
    ))
  }
}

const SEEDWORD = 'SEEDWORD'

const seedSource = {
  beginDrag (props) {
    props.beginDrag(props.index)
    return {
      index: props.index,
      word: props.word,
    }
  },
  canDrag (props) {
    return !props.selected && props.index > -1
  },
  endDrag (props, monitor) {
    const dropTarget = monitor.getDropResult()

    if (!dropTarget) {
      props.resetPending()
      return
    }

    console.log(`drop ${props.index} to ${dropTarget.targetIndex}`)
    props.onDrop(props.index, dropTarget.targetIndex)
    props.endDrag()
  },
}

const seedTarget = {
  drop (props, monitor) {
    return {
      targetIndex: props.index,
    }
  },
  canDrop (props) {
    return props.droppable
  },
  hover (props, monitor) {
    const item = monitor.getItem()
    if (props.insertPending) {
      props.insertPending(item.index, props.index)
    }
  },
}

const collectDrag = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }
}

const collectDrop = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }
}

export default DropTarget(SEEDWORD, seedTarget, collectDrop)(DragSource(SEEDWORD, seedSource, collectDrag)(DraggableSeed))


