import React from 'react';
import { useSelector } from 'react-redux';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import PasswordOutdatedModal from './password-outdated-modal';

export function PasswordOutdatedModalContainer() {
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);

  if (!isSeedlessPasswordOutdated) {
    return null;
  }

  return <PasswordOutdatedModal />;
}
