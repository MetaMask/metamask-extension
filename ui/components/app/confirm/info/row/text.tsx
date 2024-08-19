import React, { useContext } from 'react';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexWrap,
  IconColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import Tooltip from '../../../../ui/tooltip';

const InfoText = ({ text }: { text: string }) => (
  <Text color={TextColor.inherit} style={{ whiteSpace: 'pre-wrap' }}>
    {text}
  </Text>
);

export type ConfirmInfoRowTextProps = {
  text: string;
  onEditClick?: () => void;
  editIconClassName?: string;
  tooltip?: string;
  'data-testid'?: string;
};

export const ConfirmInfoRowText: React.FC<ConfirmInfoRowTextProps> = ({
  text,
  onEditClick,
  editIconClassName,
  tooltip,
  'data-testid': dataTestId,
}) => {
  const t = useContext(I18nContext);

  const isEditable = Boolean(onEditClick);

  return (
    <Box
      data-testid={dataTestId}
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={2}
      minWidth={BlockSize.Zero}
    >
      {tooltip ? (
        <Tooltip
          position="bottom"
          title={tooltip}
          wrapperStyle={{ minWidth: 0 }}
          interactive
        >
          <InfoText text={text} />
        </Tooltip>
      ) : (
        <InfoText text={text} />
      )}
      {isEditable ? (
        <ButtonIcon
          className={editIconClassName || undefined}
          color={IconColor.primaryDefault}
          ariaLabel={t('edit')}
          iconName={IconName.Edit}
          onClick={onEditClick}
          size={ButtonIconSize.Sm}
          // to reset the button padding
          style={{ marginLeft: '-4px' }}
          data-testid="edit-nonce-icon"
        />
      ) : null}
    </Box>
  );
};
