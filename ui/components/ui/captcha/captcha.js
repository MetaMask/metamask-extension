import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { nanoid, getScriptNode } from './utils';
import { getWidgetLang } from './locale.utils';

const noop = () => undefined;
let onLoadListeners = [];
let captchaScriptCreated = false;

const CaptchaScript = (lang) => {
  window.hcaptchaOnLoad = () => {
    onLoadListeners = onLoadListeners.filter((listener) => {
      listener();
      return false;
    });
  };

  const widgetLang = getWidgetLang(lang);
  const hCaptchaScriptNode = getScriptNode(widgetLang);

  document.head.appendChild(hCaptchaScriptNode);
};
/* eslint-disable no-undef */
export default class HCaptcha extends Component {
  static propTypes = {
    id: PropTypes.string,
    onClose: PropTypes.func,
    onVerify: PropTypes.func,
    onExpire: PropTypes.func,
    onError: PropTypes.func,
    lang: PropTypes.string,
    sitekey: PropTypes.string.isRequired,
  };

  static defaultProps = {
    onClose: noop,
    onVerify: noop,
    onExpire: noop,
    onError: noop,
    lang: 'en',
  };

  constructor(props) {
    super(props);
    const { id = null } = props;

    // API Methods
    this.renderCaptcha = this.renderCaptcha.bind(this);
    this.resetCaptcha = this.resetCaptcha.bind(this);
    this.removeCaptcha = this.removeCaptcha.bind(this);

    // Event Handlers
    this.handleOnLoad = this.handleOnLoad.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleExpire = this.handleExpire.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);

    const isApiReady = typeof hcaptcha !== 'undefined';

    if (!isApiReady) {
      captchaScriptCreated = false;
    }

    this.state = {
      isApiReady,
      isRemoved: false,
      elementId: id || `hcaptcha-${nanoid()}`,
      captchaId: '',
    };
  }

  componentDidMount() {
    const { lang } = this.props;
    const { isApiReady } = this.state;

    if (isApiReady) {
      this.renderCaptcha();
    } else {
      // Check if hCaptcha has already been loaded, if not create script tag and wait to render captcha elementID - hCaptcha
      if (!captchaScriptCreated) {
        // Only create the script tag once, use a global variable to track
        captchaScriptCreated = true;
        CaptchaScript(lang);
      }

      // Add onload callback to global onload listeners
      onLoadListeners.push(this.handleOnLoad);
    }
  }

  componentWillUnmount() {
    const { isApiReady, isRemoved, captchaId } = this.state;
    if (!isApiReady || isRemoved) {
      return;
    }

    // Reset any stored variables / timers when unmounting
    hcaptcha.reset(captchaId);
    hcaptcha.remove(captchaId);
  }

  shouldComponentUpdate(_, nextState) {
    // Prevent component re-rendering when these internal state variables are updated
    const isApiReady = this.state.isApiReady !== nextState.isApiReady;
    const isWidgetRemoved = this.state.isRemoved !== nextState.isRemoved;
    if (isApiReady || isWidgetRemoved) {
      return false;
    }

    return true;
  }

  componentDidUpdate(prevProps) {
    const keys = ['sitekey', 'size', 'theme', 'tabindex', 'lang', 'endpoint'];
    const match = keys.every((key) => prevProps[key] === this.props[key]);

    if (!match) {
      this.removeCaptcha();
      this.renderCaptcha();
    }
  }

  renderCaptcha() {
    const { isApiReady, elementId } = this.state;
    if (!isApiReady) {
      return;
    }

    // Render hCaptcha widget and provide neccessary callbacks - hCaptcha
    const captchaId = hcaptcha.render(document.getElementById(elementId), {
      ...this.props,
      'error-callback': this.handleError,
      'expired-callback': this.handleExpire,
      callback: this.handleSubmit,
      'close-callback': this.handleClose,
    });

    this.setState({ isRemoved: false, captchaId });
  }

  resetCaptcha() {
    const { isApiReady, isRemoved, captchaId } = this.state;

    if (!isApiReady || isRemoved) {
      return;
    }
    // Reset captcha state, removes stored token and unticks checkbox
    hcaptcha.reset(captchaId);
  }

  removeCaptcha() {
    const { isApiReady, isRemoved, captchaId } = this.state;

    if (!isApiReady || isRemoved) {
      return;
    }

    this.setState({ isRemoved: true }, () => {
      hcaptcha.remove(captchaId);
    });
  }

  handleOnLoad() {
    this.setState({ isApiReady: true }, () => {
      this.renderCaptcha();
    });
  }

  async handleSubmit() {
    const { onVerify } = this.props;
    const { isRemoved, captchaId } = this.state;

    if (typeof hcaptcha === 'undefined' || isRemoved) {
      return;
    }

    const token = hcaptcha.getResponse(captchaId);

    onVerify(token);
  }

  handleExpire() {
    const { onExpire } = this.props;
    const { isApiReady, isRemoved, captchaId } = this.state;

    if (!isApiReady || isRemoved) {
      return;
    }
    hcaptcha.reset(captchaId); // If hCaptcha runs into error, reset captcha - hCaptcha

    if (onExpire) {
      onExpire();
    }
  }

  handleClose() {
    const { onClose } = this.props;
    const { isApiReady, isRemoved, captchaId } = this.state;

    if (!isApiReady || isRemoved) {
      return;
    }
    hcaptcha.reset(captchaId); // If hCaptcha runs into error, reset captcha - hCaptcha

    if (onClose) {
      onClose();
    }
  }

  handleError(event) {
    const { onError } = this.props;
    const { isApiReady, isRemoved, captchaId } = this.state;

    if (!isApiReady || isRemoved) {
      return;
    }

    hcaptcha.reset(captchaId); // If hCaptcha runs into error, reset captcha - hCaptcha
    if (onError) {
      onError(event);
    }
  }

  execute() {
    const { isApiReady, isRemoved, captchaId } = this.state;

    if (!isApiReady || isRemoved) {
      return;
    }

    hcaptcha.execute(captchaId);
  }

  render() {
    const { elementId } = this.state;
    return (
      <div
        id={elementId}
        className="captcha-wrapper"
        sitekey={this.props.sitekey}
      />
    );
  }
}
/* eslint-disable no-undef */
