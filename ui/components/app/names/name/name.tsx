import React, { useCallback, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { Icon, IconName, IconSize } from '../../../component-library';
import { shortenAddress } from '../../../../helpers/utils/util';
import { getCurrentChainId, getNames } from '../../../../selectors';
import NameDetails from '../name-details/name-details';

export interface NameProps {
  value: string;
  type: NameType;
  providerPriority: string[];
  canEdit?: boolean;
}

export default function Name({
  value,
  type,
  providerPriority,
  canEdit,
}: NameProps) {
  const names = useSelector(getNames);
  const [modalOpen, setModalOpen] = useState(false);
  const chainId = useSelector(getCurrentChainId);

  const handleClick = useCallback(() => {
    setModalOpen(true);
  }, [setModalOpen]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const getProposedName = useCallback((): string | undefined => {
    const proposedNames = names[type]?.[value]?.[chainId]?.proposedNames || {};

    for (const providerId of providerPriority) {
      const providerProposedNames = proposedNames[providerId] ?? [];

      if (providerProposedNames.length) {
        return providerProposedNames[0];
      }
    }

    return undefined;
  }, [names]);

  const name = names[type]?.[value]?.[chainId]?.name;
  const proposedName = getProposedName();

  const formattedValue =
    type === NameType.ETHEREUM_ADDRESS ? shortenAddress(value) : value;

  const hasName = Boolean(name);
  const hasProposedName = Boolean(proposedName);
  const iconName = hasName ? IconName.Save : IconName.Warning;

  return (
    <div>
      {canEdit !== false && modalOpen && (
        <NameDetails value={value} type={type} onClose={handleModalClose} />
      )}
      <div
        className={classnames({
          name: true,
          name__saved: hasName,
          name__missing: !hasName,
        })}
        onClick={handleClick}
      >
        <Icon name={iconName} className="name__icon" size={IconSize.Lg} />
        {!hasName && <span className="name__value">{formattedValue}</span>}
        {hasName && <span className="name__name">{name}</span>}
        {!hasName && hasProposedName && (
          <span className="name__proposed">“{proposedName}”</span>
        )}
      </div>
    </div>
  );
}
