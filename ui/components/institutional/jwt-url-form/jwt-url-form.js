import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  BlockSize,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { BUTTON_VARIANT, Box, Button, Text } from '../../component-library';
import JwtDropdown from '../jwt-dropdown';

const JwtUrlForm = (props) => {
  const t = useI18nContext();
  const inputRef = useRef();
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const [fileTooBigError, setFileTooBigError] = useState();

  const renderJWTInput = () => {
    const showAddNewToken = addNewTokenClicked;
    const showJwtDropdown = props.jwtList.length >= 1;

    return (
      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        marginTop={4}
        alignItems={AlignItems.center}
        className="jwt-url-form__jwt-container"
        marginBottom={4}
      >
        {showJwtDropdown && (
          <JwtDropdown
            data-testid="jwt-dropdown"
            currentJwt={props.currentJwt ? props.currentJwt : props.jwtList[0]}
            jwtList={props.jwtList}
            onChange={(value) => {
              props.onJwtChange(value);
              setFileTooBigError(false);
            }}
          />
        )}
        {showJwtDropdown && !showAddNewToken && (
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
              variant={BUTTON_VARIANT.SECONDARY}
              onClick={() => {
                props.onJwtChange('');
                setAddNewTokenClicked(true);
              }}
            >
              {t('addNewToken')}
            </Button>
          </Box>
        )}
        {(!showJwtDropdown || showAddNewToken) && (
          <Box width={BlockSize.Full}>
            <Text
              className="jwt-url-form__instruction"
              display={Display.Block}
              variant={TextVariant.bodyMd}
              marginBottom={4}
            >
              {props.jwtInputText}
            </Text>
            {fileTooBigError && (
              <span className="error">
                <Text>{t('fileTooBig')}</Text>
              </span>
            )}
            <textarea
              className="jwt-url-form__input-jwt"
              data-testid="jwt-input"
              id="jwt-box"
              onChange={(e) => {
                props.onJwtChange(e.target.value);
                setFileTooBigError(false);
              }}
              ref={inputRef.current}
              value={props.currentJwt}
              autoFocus
            />
          </Box>
        )}
      </Box>
    );
  };

  const renderAPIURLInput = () => {
    return (
      <Box width={BlockSize.Full}>
        <Text
          className="jwt-url-form__instruction"
          display={Display.Block}
          variant={TextVariant.bodyMd}
        >
          {props.urlInputText}
        </Text>
        <Box marginTop={4}>
          <input
            className="jwt-url-form__input"
            id="api-url-box"
            data-testid="jwt-api-url-input"
            onChange={(e) => {
              props.onUrlChange(e.target.value);
            }}
            value={props.apiUrl}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box
      className="jwt-url-form"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
      marginBottom={8}
    >
      {renderJWTInput()}
      {renderAPIURLInput()}
    </Box>
  );
};

JwtUrlForm.propTypes = {
  jwtList: PropTypes.array,
  currentJwt: PropTypes.string,
  onJwtChange: PropTypes.func,
  jwtInputText: PropTypes.string,
  apiUrl: PropTypes.string,
  urlInputText: PropTypes.string,
  onUrlChange: PropTypes.func,
};

export default JwtUrlForm;
