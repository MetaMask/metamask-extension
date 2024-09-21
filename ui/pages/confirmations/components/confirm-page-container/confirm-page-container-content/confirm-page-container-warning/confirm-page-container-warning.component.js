import React from 'react';
import PropTypes from 'prop-types';
import { Icon, IconName } from '../../../../../../components/component-library';
import { IconColor } from '../../../../../../helpers/constants/design-system';

/**
 * @deprecated The `<ConfirmPageContainerWarning />` component has been deprecated in favor of the new `<BannerAlert>` component from the component-library.
 * Please update your code to use the new `<BannerAlert>` component instead, which can be found at ui/components/component-library/banner-alert/banner-alert.js.
 * You can find documentation for the new `BannerAlert` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-banneralert--docs}
 * If you would like to help with the replacement of the old `ConfirmPageContainerWarning` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20466}
 */

const ConfirmPageContainerWarning = (props) => {
  return (
    <div className="confirm-page-container-warning">
      <Icon
        name={IconName.Info}
        color={IconColor.warningDefault}
        className="confirm-page-container-warning__icon"
      />
      <div className="confirm-page-container-warning__warning">
        {props.warning}
      </div>
    </div>
  );
};

ConfirmPageContainerWarning.propTypes = {
  warning: PropTypes.string,
};

export default ConfirmPageContainerWarning;
