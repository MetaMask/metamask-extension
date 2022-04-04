import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';

export default class SignatureRequestMessage extends PureComponent {
  static propTypes = {
    data: PropTypes.array.isRequired,
    onMessageScrolled: PropTypes.func,
    setMessageRootRef: PropTypes.func,
    messageRootRef: PropTypes.object,
    messageIsScrollable: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    messageIsScrolled: false,
  };

  setMessageIsScrolled = () => {
    if (!this.props.messageRootRef || this.state.messageIsScrolled) {
      return;
    }

    const { scrollTop, offsetHeight, scrollHeight } = this.props.messageRootRef;
    const isAtBottom = scrollTop + offsetHeight >= scrollHeight;

    if (isAtBottom) {
      this.setState({ messageIsScrolled: true });
      this.props.onMessageScrolled();
    }
  };

  onScroll = debounce(this.setMessageIsScrolled, 25);

  renderNode(data) {
    return (
      <div className="siwe-message--node">
        {data.map(({ label, value }, i) => (
          <div className="siwe-message--param" key={i}>
            <div className="label">{label}</div>
            <div className="value">{`${value}`}</div>
          </div>
        ))}
      </div>
    );
  }

  renderScrollButton() {
    return (
      <div
        onClick={() => {
          this.setState({ messageIsScrolled: true });
          this.props.onMessageScrolled();
          this.props.messageRootRef.scrollTo(
            0,
            this.props.messageRootRef.scrollHeight,
          );
        }}
        className="siwe-message__scroll-button"
        data-testid="siwe-scroll-button"
      >
        <i className="fa fa-arrow-down" title={this.context.t('scrollDown')} />
      </div>
    );
  }

  render() {
    const { data } = this.props;
    return (
      <div className="siwe-message">
        <div className="siwe-message--root" ref={this.props.setMessageRootRef}>
          {this.renderNode(data)}
        </div>
      </div>
    );
  }
}
