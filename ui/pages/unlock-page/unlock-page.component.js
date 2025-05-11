import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  Button,
  ButtonSize,
  ButtonVariant,
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
  Box,
} from '../../components/component-library';
import {
  FontWeight,
  TextVariant,
  TextColor,
  BlockSize,
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextAlign,
  BackgroundColor,
  Color,
  BorderRadius,
  TextTransform,
} from '../../helpers/constants/design-system';
import Mascot from '../../components/ui/mascot';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { isFlask, isBeta } from '../../helpers/utils/build-types';
import { getCaretCoordinates } from './unlock-page.util';

export default class UnlockPage extends Component {
  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  static propTypes = {
    /**
     * History router for redirect after action
     */
    history: PropTypes.object.isRequired,
    /**
     * If isUnlocked is true will redirect to most recent route in history
     */
    isUnlocked: PropTypes.bool,
    /**
     * onClick handler for "Forgot password?" link
     */
    onRestore: PropTypes.func,
    /**
     * onSubmit handler when form is submitted
     */
    onSubmit: PropTypes.func,
    /**
     * Force update metamask data state
     */
    forceUpdateMetamaskState: PropTypes.func,
  };

  state = {
    password: '',
    error: null,
  };

  submitting = false;

  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  UNSAFE_componentWillMount() {
    const { isUnlocked, history } = this.props;

    if (isUnlocked) {
      history.push(DEFAULT_ROUTE);
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { password } = this.state;
    const { onSubmit, forceUpdateMetamaskState } = this.props;

    if (password === '' || this.submitting) {
      return;
    }

    this.setState({ error: null });
    this.submitting = true;

    try {
      await onSubmit(password);
      this.context.trackEvent(
        {
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.AppUnlocked,
          properties: {
            failed_attempts: this.failed_attempts,
          },
        },
        {
          isNewVisit: true,
        },
      );
    } catch ({ message }) {
      this.failed_attempts += 1;

      if (message === 'Incorrect password') {
        await forceUpdateMetamaskState();
        this.context.trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.AppUnlockedFailed,
          properties: {
            reason: 'incorrect_password',
            failed_attempts: this.failed_attempts,
          },
        });
      }

      this.setState({ error: message });
      this.submitting = false;
    }
  };

  handleInputChange({ target }) {
    this.setState({ password: target.value, error: null });
    // tell mascot to look at page action
    if (target.getBoundingClientRect) {
      const element = target;
      const boundingRect = element.getBoundingClientRect();
      const coordinates = getCaretCoordinates(element, element.selectionEnd);
      this.animationEventEmitter.emit('point', {
        x: boundingRect.left + coordinates.left - element.scrollLeft,
        y: boundingRect.top + coordinates.top - element.scrollTop,
      });
    }
  }

  renderMascot = () => {
    if (isFlask()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="120" height="120" />
      );
    }
    if (isBeta()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="120" height="120" />
      );
    }
    return (
      <Mascot
        animationEventEmitter={this.animationEventEmitter}
        width="120"
        height="120"
      />
    );
  };

  render() {
    const { password, error } = this.state;
    const { t } = this.context;
    const { onRestore } = this.props;

    const needHelpText = t('needHelpLinkText');

    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.stretch}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        width={BlockSize.Full}
      >
        <Box
          className="unlock-page"
          data-testid="unlock-page"
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          paddingLeft={4}
          paddingRight={4}
        >
          <Box className="unlock-page__mascot-container" marginTop={6}>
            {this.renderMascot()}
            {isBeta() ? (
              <Text
                className="unlock-page__mascot-container__beta"
                backgroundColor={BackgroundColor.primaryDefault}
                color={Color.primaryInverse}
                padding={1}
                borderRadius={BorderRadius.LG}
                textTransform={TextTransform.Uppercase}
              >
                {t('beta')}
              </Text>
            ) : null}
          </Box>
          <Text
            data-testid="unlock-page-title"
            as="h1"
            variant={TextVariant.displayMd}
            fontWeight={FontWeight.Medium}
            marginTop={1}
            marginBottom={1}
            color={TextColor.textDefault}
            textAlign={TextAlign.Center}
          >
            {t('welcomeBack')}
          </Text>
          <Text
            color={TextColor.textAlternative}
            marginBottom={[4, 4, 8]}
            textAlign={TextAlign.Center}
          >
            {t('unlockMessage')}
          </Text>
          <Box
            as="form"
            onSubmit={this.handleSubmit}
            width={BlockSize.Full}
            marginBottom={6}
          >
            <FormTextField
              id="password"
              inputProps={{
                'data-testid': 'unlock-password',
              }}
              label={t('password')}
              placeholder={t('enterPasswordContinue')}
              type={TextFieldType.Password}
              value={password}
              onChange={(e) => this.handleInputChange(e)}
              error={Boolean(error)}
              helpText={error}
              autoFocus
              autoComplete="current-password"
              theme="material"
              width={BlockSize.Full}
              size={FormTextFieldSize.Lg}
              marginBottom={4}
            />
            <Button
              type="submit"
              data-testid="unlock-submit"
              disabled={!this.state.password}
              size={ButtonSize.Lg}
              onClick={this.handleSubmit}
              block
            >
              {this.context.t('unlock')}
            </Button>
          </Box>

          <Button
            variant={ButtonVariant.Link}
            tabindex
            key="import-account"
            data-testid="unlock-page-link"
            onClick={() => onRestore()}
            marginBottom={6}
          >
            {t('forgotPassword')}
          </Button>

          <Text>
            {t('needHelp', [
              <Button
                variant={ButtonVariant.Link}
                href={SUPPORT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                key="need-help-link"
                onClick={() => {
                  this.context.trackEvent(
                    {
                      category: MetaMetricsEventCategory.Navigation,
                      event: MetaMetricsEventName.SupportLinkClicked,
                      properties: {
                        url: SUPPORT_LINK,
                      },
                    },
                    {
                      contextPropsIntoEventProperties: [
                        MetaMetricsContextProp.PageTitle,
                      ],
                    },
                  );
                }}
              >
                {needHelpText}
              </Button>,
            ])}
          </Text>
        </Box>
      </Box>
    );
  }
}
