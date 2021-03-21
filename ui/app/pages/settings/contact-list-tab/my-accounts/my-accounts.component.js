import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ContactList from '../../../../components/app/contact-list';

export default class ViewContact extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    myAccounts: PropTypes.array,
  };

  renderMyAccounts() {
    const { myAccounts } = this.props;

    return (
      <div>
        <ContactList searchForMyAccounts={() => myAccounts} />
      </div>
    );
  }

  render() {
    return <div className="address-book">{this.renderMyAccounts()}</div>;
  }
}
