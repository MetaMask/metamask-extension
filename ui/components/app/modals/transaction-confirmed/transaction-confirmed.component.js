import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';
import { Icon, IconName, IconSize, Text } from '../../../component-library';
import {
  IconColor,
  TextVariant,
  TextAlign,
  FontWeight,
} from '../../../../helpers/constants/design-system';

export default class TransactionConfirmed extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    onSubmit: PropTypes.func,
    hideModal: PropTypes.func,
  };

  handleSubmit = () => {
    const { hideModal, onSubmit } = this.props;

    hideModal();

    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit();
    }
  };

  render() {
    const { t } = this.context;

    return (
      <Modal onSubmit={this.handleSubmit} submitText={t('ok')}>
        <div className="transaction-confirmed__content">
          <Icon
            name={IconName.Check}
            color={IconColor.successDefault}
            size={IconSize.Xl}
          />
          <Text
            variant={TextVariant.headingMd}
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Center}
          >
            {`${t('confirmed')}!`}
          </Text>
          <Text textAlign={TextAlign.Center}>
            {t('initialTransactionConfirmed')}
          </Text>
        </div>
      </Modal>
    );
  }
}
