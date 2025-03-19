import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Label, Box, Text } from '../../component-library';
import { Textarea } from '../../component-library/textarea';
import { setNoteToTraderMessage } from '../../../store/institutional/institution-background';
import {
  getIsNoteToTraderSupported,
  State,
} from '../../../selectors/institutional/selectors';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { useConfirmContext } from '../../../pages/confirmations/context/confirm';
import { getConfirmationSender } from '../../../pages/confirmations/components/confirm/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isSignatureTransactionType } from '../../../pages/confirmations/utils';

const NoteToTrader: React.FC = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const [noteText, setNoteText] = useState('');

  const { currentConfirmation } = useConfirmContext();
  const isSignature = isSignatureTransactionType(currentConfirmation);
  const { from } = getConfirmationSender(currentConfirmation);
  const fromChecksumHexAddress = toChecksumHexAddress(from || '');
  const isNoteToTraderSupported = useSelector((state: State) =>
    getIsNoteToTraderSupported(state, fromChecksumHexAddress),
  );

  const MAX_LENGTH = 280;

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setNoteToTraderMessage(noteText));
    }, 700);

    return () => clearTimeout(timer);
  }, [noteText]);

  if (!isNoteToTraderSupported || isSignature) {
    return null;
  }

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={0}
      marginBottom={4}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
      >
        <Box
          className="note-header"
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Label htmlFor="transaction-note">{t('transactionNote')}</Label>
          <Text className="note-header__counter">
            {noteText.length}/{MAX_LENGTH}
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          className="note-field"
        >
          <Textarea
            id="transaction-note"
            data-testid="transaction-note"
            onChange={({ target: { value } }) => setNoteText(value)}
            value={noteText}
            height={BlockSize.Full}
            width={BlockSize.Full}
            maxLength={MAX_LENGTH}
            placeholder={t('notePlaceholder')}
            padding={2}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default NoteToTrader;
