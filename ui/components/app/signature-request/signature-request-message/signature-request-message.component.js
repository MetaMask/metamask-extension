import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import classnames from 'classnames';

export default class SignatureRequestMessage extends PureComponent {
  static propTypes = {
    data: PropTypes.object.isRequired,
    onMessageScrolled: PropTypes.func,
    setMessageRootRef: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  messageAreaRef;

  state = {
    messageIsScrolled: false,
  };

  setMessageIsScrolled = () => {
    if (!this.messageAreaRef || this.state.messageIsScrolled) {
      return;
    }

    const { scrollTop, offsetHeight, scrollHeight } = this.messageAreaRef;
    const isAtBottom = scrollTop + offsetHeight >= scrollHeight;

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

  render() {
    const { data } = this.props;

    return (
      <div
        onScroll={this.onScroll}
        ref={(ref) => {
          this.messageAreaRef = ref;
        }}
        className="signature-request-message"
      >
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
