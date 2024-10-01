import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Display } from '../../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
} from '../../../component-library';
import SnapLinkWarning from '../snap-link-warning';
import useNavigation from '../../../../hooks/snaps/useNavigation';

export const SnapUILink = ({ href, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isMetaMaskUrl = href.startsWith('metamask:');
  const { navigate } = useNavigation();

  const handleLinkClick = () => {
    if (isMetaMaskUrl) {
      navigate(href);
    } else {
      setIsOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsOpen(false);
  };

  if (isMetaMaskUrl) {
    return (
      <ButtonLink
        as="a"
        size={ButtonLinkSize.Inherit}
        className="snap-ui-link"
        onClick={handleLinkClick}
      >
        {children}
      </ButtonLink>
    );
  }

  return (
    <>
      <SnapLinkWarning isOpen={isOpen} onClose={handleModalClose} url={href} />
      <ButtonLink
        as="a"
        onClick={handleLinkClick}
        externalLink
        size={ButtonLinkSize.Inherit}
        display={Display.Inline}
        className="snap-ui-link"
      >
        {children}
        <Icon name={IconName.Export} size={IconSize.Inherit} marginLeft={1} />
      </ButtonLink>
    </>
  );
};

SnapUILink.propTypes = {
  children: PropTypes.string,
  href: PropTypes.string,
};
