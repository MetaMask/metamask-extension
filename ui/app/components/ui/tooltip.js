import PropTypes from 'prop-types'
import React, {Component} from 'react'
// import ReactTooltip from 'react-tooltip-component'

import ReactDOM from 'react-dom';

// TODO: replace this or consider making a pull request to react-tooltip-component upstream
class ReactTooltip extends Component {
  static propTypes = {
    container: PropTypes.any,
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    position: PropTypes.oneOf(['left', 'top', 'right', 'bottom']),
    fixed: PropTypes.bool,
    space: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };

  static defaultProps = {
    container: document.body,
    position: 'top',
    fixed: true,
    space: 5
  };

  UNSAFE_componentDidMount = () => {
    this.container = this.props.container || document.body;
    this.componentEl = ReactDOM.findDOMNode(this);
    this.tooltipEl = document.createElement('div');

    let tooltipArrowEl = document.createElement('div');
    tooltipArrowEl.className = 'tooltip-arrow';

    let tooltipContentEl = document.createElement('div');
    tooltipContentEl.className = 'tooltip-inner';
    tooltipContentEl.textContent = this.props.title;

    this.tooltipEl.appendChild(tooltipArrowEl);
    this.tooltipEl.appendChild(tooltipContentEl);
    this.tooltipEl.className = 'tooltip ' + this.props.position;
    this.container.appendChild(this.tooltipEl);
    this.resetTooltip();

    this.componentEl.addEventListener(this.props.fixed ? 'mouseenter' : 'mousemove', this.handleMouseMove);
    this.componentEl.addEventListener('mouseleave', this.handleMouseOut);
  };

  UNSAFE_componentDidUpdate = () => {
    this.tooltipEl.className = 'tooltip ' + this.props.position;
    this.tooltipEl.childNodes[1].textContent = this.props.title;
  };


  UNSAFE_componentWillUnmount = () => {
    this.componentEl.removeEventListener(this.props.fixed ? 'mouseenter' : 'mousemove', this.handleMouseMove);
    this.componentEl.removeEventListener('mouseleave', this.handleMouseOut);
    this.container.removeChild(this.tooltipEl);
  };

  resetTooltip = () => {
    this.tooltipEl.style.transition = 'opacity 0.4s';
    this.tooltipEl.style.left = '-500px';
    this.tooltipEl.style.top = '-500px';
    this.tooltipEl.style.opacity = 0;
  };

  handleMouseMove = (e) => {
    if (this.props.title === '') {
      return;
    }

    let tooltipPosition = this.getTooltipPosition(e);
    let tooltipOffset = this.getTooltipOffset();

    this.tooltipEl.style.left = tooltipPosition.x + tooltipOffset.x + 'px';
    this.tooltipEl.style.top = tooltipPosition.y + tooltipOffset.y + 'px';
    this.tooltipEl.style.opacity = 1;
  };

  handleMouseOut = () => {
    this.resetTooltip();
  };

  getTooltipPosition = (e) => {
    let pointX;
    let pointY;
    let bodyRect = document.body.getBoundingClientRect();
    let containerRect = this.container.getBoundingClientRect();
    let containerOffsetX = containerRect.left - bodyRect.left;
    let containerOffsetY = containerRect.top - bodyRect.top;
    if (this.props.fixed) {
      let componentRect = this.componentEl.getBoundingClientRect();
      let componentOffsetX = componentRect.left - containerOffsetX;
      let componentOffsetY = componentRect.top - containerOffsetY;
      let componentWidth = this.componentEl.offsetWidth;
      let componentHeight = this.componentEl.offsetHeight;
      let cOffsetX = 0;
      let cOffsetY = 0;
      switch (this.props.position) {
        case 'top':
          cOffsetX = componentWidth / 2;
          cOffsetY = 0;
          break;
        case 'right':
          cOffsetX = componentWidth;
          cOffsetY = componentHeight / 2;
          break;
        case 'bottom':
          cOffsetX = componentWidth / 2;
          cOffsetY = componentHeight;
          break;
        case 'left':
          cOffsetX = 0;
          cOffsetY = componentHeight / 2;
          break;
      }
      pointX = componentOffsetX + cOffsetX + (window.scrollX || window.pageXOffset);
      pointY = componentOffsetY + cOffsetY + (window.scrollY || window.pageYOffset);
    } else {
      let clientX = e.clientX;
      let clientY = e.clientY;
      pointX = clientX - containerOffsetX + (window.scrollX || window.pageXOffset);
      pointY = clientY - containerOffsetY + (window.scrollY || window.pageYOffset);
    }
    return {
      x: pointX,
      y: pointY
    };
  };

  getTooltipOffset = () => {
    let tooltipW = this.tooltipEl.offsetWidth;
    let tooltipH = this.tooltipEl.offsetHeight;
    let offsetX = 0;
    let offsetY = 0;
    switch (this.props.position) {
      case 'top':
        offsetX = -(tooltipW / 2);
        offsetY = -(tooltipH + Number(this.props.space));
        break;
      case 'right':
        offsetX = Number(this.props.space);
        offsetY = -(tooltipH / 2);
        break;
      case 'bottom':
        offsetX = -(tooltipW / 2);
        offsetY = Number(this.props.space);
        break;
      case 'left':
        offsetX = -(tooltipW + Number(this.props.space));
        offsetY = -(tooltipH / 2);
        break;
    }
    return {
      x: offsetX,
      y: offsetY
    };
  };

  render() {
    return this.props.children;
  }
}

// export default Tooltip;

function Tooltip ({ position, title, children }) {
  return (
    <ReactTooltip position={position} title={title} fixed>
      {children}
    </ReactTooltip>
  )
}

Tooltip.defaultProps = {
  position: 'left',
  children: null,
}

Tooltip.propTypes = {
  position: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
}

module.exports = Tooltip
