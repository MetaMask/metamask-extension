import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class SignatureRequestMessage extends PureComponent {
  static propTypes = {
    data: PropTypes.object.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

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
      <div className="signature-request-message">
        <div className="signature-request-message__title">
          {this.context.t('signatureRequest1')}
        </div>
        <div className="signature-request-message--root">
          {this.renderNode(data)}
        </div>
      </div>
    );
  }
}
