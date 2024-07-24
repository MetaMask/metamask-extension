import React, { useState } from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  BlockSize,
  FlexDirection,
  TextVariant,
  BackgroundColor,
  TextColor,
  BorderRadius,
  BorderStyle,
} from '../../../helpers/constants/design-system';
import { ButtonVariant, Box, Button, Text } from '../../component-library';
import { Textarea, TextareaResize } from '../../component-library/textarea';
import JwtDropdown from '../jwt-dropdown';

type JwtUrlFormProps = {
  jwtList: string[];
  onJwtChange: (value: string) => void;
  currentJwt?: string;
  jwtInputText?: string;
};

const JwtUrlForm: React.FC<JwtUrlFormProps> = ({
  jwtList,
  onJwtChange,
  currentJwt = '',
  jwtInputText = '',
}) => {
  const t = useI18nContext();
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const showJwtDropdown = jwtList.length >= 1;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
      marginBottom={8}
    >
      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        marginTop={4}
        alignItems={AlignItems.center}
        marginBottom={4}
      >
        {showJwtDropdown && (
          <JwtDropdown
            key={currentJwt}
            data-testid="jwt-dropdown"
            currentJwt={currentJwt || jwtList[0]}
            jwtList={jwtList}
            onChange={(value) => {
              onJwtChange(value);
            }}
          />
        )}

        {showJwtDropdown && !addNewTokenClicked && (
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            marginTop={2}
          >
            <Text>{t('or')}</Text>
            <Button
              data-testid="addNewToken-btn"
              variant={ButtonVariant.Secondary}
              onClick={() => {
                onJwtChange('');
                setAddNewTokenClicked(true);
              }}
            >
              {t('addNewToken')}
            </Button>
          </Box>
        )}
        {(!showJwtDropdown || addNewTokenClicked) && (
          <Box width={BlockSize.Full}>
            <Text
              display={Display.Block}
              variant={TextVariant.bodyMd}
              marginBottom={4}
            >
              {jwtInputText}
            </Text>
            <Box width={BlockSize.Full}>
              <Textarea
                data-testid="jwt-input"
                id="jwt-box"
                onChange={(e) => {
                  onJwtChange(e.target.value);
                }}
                value={currentJwt}
                autoFocus
                height={BlockSize.Full}
                width={BlockSize.Full}
                resize={TextareaResize.Both}
                borderRadius={BorderRadius.SM}
                borderStyle={BorderStyle.solid}
                backgroundColor={BackgroundColor.backgroundDefault}
                color={TextColor.textDefault}
                padding={2}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default JwtUrlForm;
