import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
import { Icon, IconName, IconSize } from '../../component-library';
import { shortenAddress } from '../../../helpers/utils/util';
import { useName } from '../../../hooks/useName';
import { updateProposedNames } from '../../../store/actions';
import NameDetails from './name-details/name-details';

const DEFAULT_UPDATE_DELAY = 60 * 5; // 5 Minutes

export interface NameProps {
  /** Whether to prevent the modal from opening when the component is clicked. */
  disableEdit?: boolean;

  /** Whether to disable updating the proposed names on render. */
  disableUpdate?: boolean;

  /** The order of source IDs to prioritise when choosing which proposed name to display. */
  sourcePriority?: string[];

  /** The type of value, e.g. NameType.ETHEREUM_ADDRESS */
  type: NameType;

  /** The minimum number of seconds to wait between updates of the proposed names on render. */
  updateDelay?: number;

  /** The raw value to display the name of. */
  value: string;
}

export default function Name({
  value,
  type,
  sourcePriority,
  disableEdit,
  updateDelay,
  disableUpdate,
}: NameProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const dispatch = useDispatch();

  const { name, proposedNames, proposedNamesLastUpdated } = useName(
    value,
    type,
  );

  useEffect(() => {
    if (disableUpdate) {
      return;
    }

    const nowMilliseconds = Date.now();
    const nowSeconds = Math.floor(nowMilliseconds / 1000);
    const secondsSinceLastUpdate = nowSeconds - (proposedNamesLastUpdated ?? 0);
    const delay = updateDelay ?? DEFAULT_UPDATE_DELAY;

    if (secondsSinceLastUpdate < delay) {
      return;
    }

    dispatch(updateProposedNames({ value, type }));
  });

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
