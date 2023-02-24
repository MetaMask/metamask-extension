import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

class DragAndDrop extends Component {
  dropRef = React.createRef();

  static propTypes = {
    handleDrop: PropTypes.func.isRequired,
    className: PropTypes.string,
    children: PropTypes.node,
  };

  state = {
    dragging: false,
  };

  handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      this.setState({ dragging: true });
    }
  };

  handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter -= 1;
    if (this.dragCounter === 0) {
      this.setState({ dragging: false });
    }
  };

  handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ dragging: false });
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      this.props.handleDrop(e.dataTransfer.files);
      e.dataTransfer.clearData();
      this.dragCounter = 0;
    }
  };

  componentDidMount() {
    this.dragCounter = 0;
    const div = this.dropRef.current;
    div.addEventListener('dragenter', this.handleDragIn);
    div.addEventListener('dragleave', this.handleDragOut);
    div.addEventListener('dragover', this.handleDrag);
    div.addEventListener('drop', this.handleDrop);
  }

  componentWillUnmount() {
    const div = this.dropRef.current;
    div.removeEventListener('dragenter', this.handleDragIn);
    div.removeEventListener('dragleave', this.handleDragOut);
    div.removeEventListener('dragover', this.handleDrag);
    div.removeEventListener('drop', this.handleDrop);
  }

  render() {
    return (
      <div
        className={classnames('drag-and-drop__container', this.props.className)}
        ref={this.dropRef}
      >
        {this.state.dragging && (
          <div className="drag-and-drop__overlay">
            <div className="drag-and-drop__text-container">
              <div>Drop your JWT file here.</div>
            </div>
          </div>
        )}
        {this.props.children}
      </div>
    );
  }
}
export default DragAndDrop;
