import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import classnames from 'classnames';

export default class SignatureRequestMessage extends PureComponent {
  static propTypes = {
    data: PropTypes.object.isRequired,
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
    const isAtBottom = Math.round(scrollTop) + offsetHeight >= scrollHeight;

    if (isAtBottom) {
      this.setState({ messageIsScrolled: true });
      this.props.onMessageScrolled();
    }
  };

  onScroll = debounce(this.setMessageIsScrolled, 25);

  renderNode(data) {
    return (
      <div className="signature-request-message--node">
        {Object.entries(data).map(([label, value], i) => (
          <div
            className={classnames('signature-request-message--node', {
              'signature-request-message--node-leaf':
                typeof value !== 'object' || value === null,
            })}
            key={i}
          >
            <span className="signature-request-message--node-label">
              {label}:{' '}
            </span>
            {typeof value === 'object' && value !== null ? (
              this.renderNode(value)
            ) : (
              <span className="signature-request-message--node-value">
                {`${value}`}
              </span>
            )}
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
        className="signature-request-message__scroll-button"
        data-testid="signature-request-scroll-button"
      >
        <i className="fa fa-arrow-down" title={this.context.t('scrollDown')} />
      </div>
    );
  }

  render() {
    const { data, messageIsScrollable } = this.props;

    return (
      <div onScroll={this.onScroll} className="signature-request-message">
        {messageIsScrollable ? this.renderScrollButton() : null}
        <div className="signature-request-message__title">
          {this.context.t('signatureRequest1')}
        </div>
        <div
          className="signature-request-message--root"
          ref={this.props.setMessageRootRef}
        >
          {this.renderNode(data)}
        </div>
      </div>
    );
  }
}
