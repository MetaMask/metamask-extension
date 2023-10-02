import React, { useCallback, useContext, useEffect, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import { toChecksumAddress } from 'ethereumjs-util';
import { Icon, IconName, IconSize } from '../../component-library';
import { shortenAddress } from '../../../helpers/utils/util';
import { useName } from '../../../hooks/useName';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import NameDetails from './name-details/name-details';

export interface NameProps {
  /** Whether to prevent the modal from opening when the component is clicked. */
  disableEdit?: boolean;

  /** Whether this is being rendered inside the NameDetails modal. */
  internal?: boolean;

  /** The type of value, e.g. NameType.ETHEREUM_ADDRESS */
  type: NameType;

  /** The raw value to display the name of. */
  value: string;
}

function formatValue(value: string, type: NameType): string {
  switch (type) {
    case NameType.ETHEREUM_ADDRESS:
      return shortenAddress(toChecksumAddress(value));

    default:
      return value;
  }
}

export default function Name({
  value,
  type,
  disableEdit,
  internal,
}: NameProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

  const { name } = useName(value, type);

  useEffect(() => {
    if (internal) {
      return;
    }

    trackEvent({
      event: MetaMetricsEventName.PetnameDisplayed,
      category: MetaMetricsEventCategory.Petnames,
      properties: {
        petname_category: type,
        has_petname: Boolean(name?.length),
      },
    });
  }, []);

  const handleClick = useCallback(() => {
    setModalOpen(true);
  }, [setModalOpen]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const formattedValue = formatValue(value, type);
  const hasName = Boolean(name);
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
      </div>
    </div>
  );
}
