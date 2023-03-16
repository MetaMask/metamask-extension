import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  DISPLAY,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';
import JwtDropdown from '../jwt-dropdown';
import Button from '../../ui/button';
import Box from '../../ui/box';

const JwtUrlForm = (props) => {
  const t = useI18nContext();
  const inputRef = useRef();
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const [fileTooBigError, setFileTooBigError] = useState();

  const renderJWTInput = () => {
    const showAddNewToken = addNewTokenClicked;
    const showJwtDropdown = props.jwtList.length >= 1;

    return (
      <Box className="jwt-url-form__jwt-container" marginBottom={6}>
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
            className="jwt-url-form__btn__container"
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            marginTop={2}
          >
            <Text>{t('or')}</Text>
            <Button
              type="secondary"
              medium="true"
              onClick={() => {
                props.onJwtChange('');
                setAddNewTokenClicked(true);
              }}
            >
              <Text>{t('addNewToken')}</Text>
            </Button>
          </Box>
        )}
        {(!showJwtDropdown || showAddNewToken) && (
          <Box>
            <Text className="jwt-url-form__instruction">
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
              borderColor={BorderColor.borderDefault}
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
      <Box className="jwt-url-form__jwt-apiUrlInput">
        <Text className="jwt-url-form__instruction">{props.urlInputText}</Text>
        <Box>
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
      display={DISPLAY.FLEX}
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
