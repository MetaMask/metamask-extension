import React, { useCallback, useMemo, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import { Icon, IconName, IconSize } from '../../component-library';
import { shortenAddress } from '../../../helpers/utils/util';
import { useName } from '../../../hooks/useName';
import NameDetails from './name-details/name-details';

export interface NameProps {
  value: string;
  type: NameType;
  sourcePriority: string[];
  disableEdit?: boolean;
}

export default function Name({
  value,
  type,
  sourcePriority,
  disableEdit,
}: NameProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { name, proposedNames } = useName(value, type);

  const handleClick = useCallback(() => {
    setModalOpen(true);
  }, [setModalOpen]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const proposedName = useMemo((): string | undefined => {
    for (const sourceId of sourcePriority ?? []) {
      const sourceProposedNames = proposedNames[sourceId] ?? [];

      if (sourceProposedNames.length) {
        return sourceProposedNames[0];
      }
    }

    return undefined;
  }, [proposedNames, sourcePriority]);

  const formattedValue =
    type === NameType.ETHEREUM_ADDRESS ? shortenAddress(value) : value;

  const hasName = Boolean(name);
  const hasProposedName = Boolean(proposedName);
  const iconName = hasName ? IconName.Save : IconName.Warning;

  return (
    <div>
      {!disableEdit && modalOpen && (
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
