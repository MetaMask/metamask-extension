import React, { useMemo } from 'react';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { BorderRadius } from '../../../../helpers/constants/design-system';
import { Skeleton } from '../../../../components/component-library/skeleton';

type ButtonRowProps = {
  title: string;
  description?: string | React.ReactNode;
  descriptionClassName?: string;
  descriptionTestId?: string;
  startIconName?: IconName;
  endIconName?: IconName;
  endAccessory?: React.ReactNode;
  onClick?: () => void;
  'data-testid'?: string;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
};

const ButtonRow = ({
  title,
  description,
  descriptionClassName,
  descriptionTestId,
  startIconName,
  endIconName,
  endAccessory,
  onClick,
  'data-testid': dataTestId,
  className = '',
  loading = false,
  disabled = false,
}: ButtonRowProps) => {
  const Component = onClick ? 'button' : 'div';

  const endElement = useMemo(() => {
    if (endAccessory) {
      return <Box className="ml-auto flex-shrink-0">{endAccessory}</Box>;
    }
    if (onClick && !loading) {
      return (
        <Icon
          name={endIconName ?? IconName.ArrowDown}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
          className="ml-auto"
        />
      );
    }
    return null;
  }, [endAccessory, endIconName, onClick, loading]);

  const descriptionElement = useMemo(() => {
    if (loading) {
      return <Skeleton width="100%" height={20} />;
    }
    if (typeof description === 'string') {
      return (
        <Text
          data-testid={descriptionTestId}
          variant={TextVariant.BodyMd}
          className={twMerge('text-text-alternative', descriptionClassName)}
        >
          {description}
        </Text>
      );
    }

    return description;
  }, [description, descriptionClassName, descriptionTestId, loading]);

  return (
    <Box
      asChild
      className={twMerge(
        'button-row flex w-full items-center px-4 gap-4',
        className,
      )}
      data-testid={dataTestId}
      onClick={onClick}
    >
      <Component
        className="button-row__button"
        {...(Component === 'button' ? { disabled } : {})}
      >
        {startIconName &&
          (loading ? (
            <Skeleton
              width={40}
              height={40}
              borderRadius={BorderRadius.full}
              style={{ flexShrink: 0 }}
            />
          ) : (
            <AvatarIcon
              iconName={startIconName}
              size={AvatarIconSize.Lg}
              color={IconColor.IconAlternative}
            />
          ))}
        <Box className="flex flex-col text-left w-full" gap={loading ? 2 : 0}>
          {loading ? (
            <Skeleton width="100%" height={20} />
          ) : (
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {title}
            </Text>
          )}
          {descriptionElement}
        </Box>
        {endElement}
      </Component>
    </Box>
  );
};

export default ButtonRow;
