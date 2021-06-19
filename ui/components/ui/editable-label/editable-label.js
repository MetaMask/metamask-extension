import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ENS from '../../../../app/scripts/controllers/ens/ens';
import { CHAIN_ID_TO_NETWORK_ID_MAP } from '../../../../shared/constants/network';

class EditableLabel extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    chainId: PropTypes.string,
    address: PropTypes.string,
  };

  state = {
    isEditing: false,
    value: this.props.defaultValue || '',
  };

  componentDidMount() {
    const { value } = this.state;
    const { address } = this.props;

    if (this.checkAccountLabel(value)) {
      this.doENSReverseLookup(address);
    }
  }

  checkAccountLabel(accountLabel) {
    // eslint-disable-next-line require-unicode-regexp
    const regExp = /Account [1-9][0-9]*$/;
    return regExp.test(accountLabel);
  }

  async doENSReverseLookup(addr) {
    const { chainId } = this.props;
    const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];

    if (ENS.getNetworkEnsSupport(network)) {
      const ens = new ENS({
        network,
        provider: global.ethereumProvider,
      });
      try {
        const name = await ens.reverse(addr);
        this.setState({ value: name });
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }

  handleSubmit() {
    const { value } = this.state;

    if (value === '') {
      return;
    }

    Promise.resolve(this.props.onSubmit(value)).then(() =>
      this.setState({ isEditing: false }),
    );
  }

  renderEditing() {
    const { value } = this.state;

    return [
      <input
        key={1}
        type="text"
        required
        dir="auto"
        value={this.state.value}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            this.handleSubmit();
          }
        }}
        onChange={(event) => this.setState({ value: event.target.value })}
        className={classnames('large-input', 'editable-label__input', {
          'editable-label__input--error': value === '',
        })}
        autoFocus
      />,
      <button
        className="editable-label__icon-button"
        key={2}
        onClick={() => this.handleSubmit()}
      >
        <i className="fa fa-check editable-label__icon" />
      </button>,
    ];
  }

  renderReadonly() {
    return [
      <div key={1} className="editable-label__value">
        {this.state.value}
      </div>,
      <button
        key={2}
        className="editable-label__icon-button"
        onClick={() => this.setState({ isEditing: true })}
      >
        <i className="fas fa-pencil-alt editable-label__icon" />
      </button>,
    ];
  }

  render() {
    const { isEditing } = this.state;
    const { className } = this.props;

    return (
      <div className={classnames('editable-label', className)}>
        {isEditing ? this.renderEditing() : this.renderReadonly()}
      </div>
    );
  }
}

export default EditableLabel;
