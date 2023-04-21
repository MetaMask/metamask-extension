import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import Identicon from '../../../ui/identicon';
import Popover from '../../../ui/popover';
import Box from '../../../ui/box';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  Size,
} from '../../../../helpers/constants/design-system';
import { AvatarAccount } from '../../../component-library';

export default function AccountModalContainer(props, context) {
  const {
    className,
    selectedIdentity,
    showBackButton,
    backButtonAction,
    hideModal,
    isAccountDetailsModal,
    children,
  } = props;

  return process.env.MULTICHAIN && isAccountDetailsModal ? (
    <>
      <Popover
        className="multichain-account-details__popover"
        contentProps={{ justifyContent: JustifyContent.flexEnd }}
        title={
          <Box
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <AvatarAccount address={selectedIdentity.address} size={Size.LG} />
          </Box>
        }
        onClose={() => {
          console.log('onClose');
        }}
      >
        <Box
          padding={4}
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.flexStart}
          flexDirection={FLEX_DIRECTION.COLUMN}
          gap={2}
        >
          {children}
        </Box>
      </Popover>
    </>
  ) : (
    <div
      className={classnames(className, 'account-modal')}
      style={{ borderRadius: '4px' }}
    >
      <div className="account-modal__container">
        <div>
          <Identicon address={selectedIdentity.address} diameter={64} />
        </div>
        {showBackButton && (
          <div className="account-modal__back" onClick={backButtonAction}>
            <i className="fa fa-angle-left fa-lg" />
            <span className="account-modal__back-text">
              {context.t('back')}
            </span>
          </div>
        )}
        <button className="account-modal__close" onClick={hideModal} />
        {children}
      </div>
    </div>
  );
}

AccountModalContainer.contextTypes = {
  t: PropTypes.func,
};

AccountModalContainer.defaultProps = {
  showBackButton: false,
  children: null,
  backButtonAction: undefined,
};

AccountModalContainer.propTypes = {
  className: PropTypes.string,
  selectedIdentity: PropTypes.object.isRequired,
  showBackButton: PropTypes.bool,
  backButtonAction: PropTypes.func,
  hideModal: PropTypes.func.isRequired,
  isAccountDetailsModal: PropTypes.bool,
  children: PropTypes.node,
};
