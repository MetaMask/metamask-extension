import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { DragSource, DropTarget } from 'react-dnd'



class DraggableSeed extends Component {

  static propTypes = {
    // React DnD Props
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,
    // Own Props
    onClick: PropTypes.func.isRequired,
    index: PropTypes.number,
    word: PropTypes.string,
    className: PropTypes.string,
    selected: PropTypes.bool,
    droppable: PropTypes.bool,
  }

  static defaultProps = {
    className: '',
    onClick () {},
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
    return {
      index: props.index,
      word: props.word,
    }
  },
  canDrag (props) {
    return !props.selected
  },
}

const seedTarget = {
  drop (props, monitor) {
    console.log(props);
    console.log(monitor.getItem())
  },
  canDrop (props) {
    return props.droppable
  }
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


