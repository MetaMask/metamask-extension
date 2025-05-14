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
  editIconDataTestId?: string;
};

export const ConfirmInfoRowText: React.FC<ConfirmInfoRowTextProps> = ({
  text,
  onEditClick,
  editIconClassName,
  tooltip,
  'data-testid': dataTestId,
  editIconDataTestId,
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
      {isEditable ? (
        <ButtonIcon
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          className={editIconClassName || undefined}
          color={IconColor.primaryDefault}
          ariaLabel={t('edit')}
          iconName={IconName.Edit}
          onClick={onEditClick}
          size={ButtonIconSize.Sm}
          // to reset the button padding
          style={{ marginRight: '-4px' }}
          data-testid={editIconDataTestId}
        />
      ) : null}
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
    </Box>
  );
};
