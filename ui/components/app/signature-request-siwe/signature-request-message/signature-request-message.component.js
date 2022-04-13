import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class SignatureRequestMessage extends PureComponent {
  static propTypes = {
    data: PropTypes.array.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

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

  render() {
    const { data } = this.props;
    return (
      <div className="siwe-message">
        <div className="siwe-message--root">{this.renderNode(data)}</div>
      </div>
    );
  }
}
