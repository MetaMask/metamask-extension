import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

let index = 0;
let extraSheet;

const insertRule = (css) => {
  if (!extraSheet) {
    extraSheet = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(extraSheet);
    extraSheet = extraSheet.sheet || extraSheet.styleSheet;
  }

  extraSheet.insertRule(css, (extraSheet.cssRules || extraSheet.rules).length);

  return extraSheet;
};

const insertKeyframesRule = (keyframes) => {
  // eslint-disable-next-line no-plusplus
  const name = `anim_${++index}${Number(new Date())}`;
  let css = `@keyframes ${name} {`;

  Object.keys(keyframes).forEach((key) => {
    css += `${key} {`;

    Object.keys(keyframes[key]).forEach((property) => {
      const part = `:${keyframes[key][property]};`;
      css += property + part;
    });

    css += '}';
  });

  css += '}';

  insertRule(css);

  return name;
};

const animation = {
  show: {
    animationDuration: '0.3s',
    animationTimingFunction: 'ease-out',
  },
  hide: {
    animationDuration: '0.3s',
    animationTimingFunction: 'ease-out',
  },
  showContentAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 1,
    },
  }),
  hideContentAnimation: insertKeyframesRule({
    '0%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    },
  }),
  showBackdropAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 0.9,
    },
  }),
  hideBackdropAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0.9,
    },
    '100%': {
      opacity: 0,
    },
  }),
};

const endEvents = ['transitionend', 'animationend'];

function addEventListener(node, eventName, eventListener) {
  node.addEventListener(eventName, eventListener, false);
}

function removeEventListener(node, eventName, eventListener) {
  node.removeEventListener(eventName, eventListener, false);
}

const removeEndEventListener = (node, eventListener) => {
  if (endEvents.length === 0) {
    return;
  }
  endEvents.forEach((endEvent) => {
    removeEventListener(node, endEvent, eventListener);
  });
};

const addEndEventListener = (node, eventListener) => {
  if (endEvents.length === 0) {
    window.setTimeout(eventListener, 0);
    return;
  }
  endEvents.forEach((endEvent) => {
    addEventListener(node, endEvent, eventListener);
  });
};

const FadeModal = forwardRef(function FadeModal(
  {
    backdrop = true,
    backdropStyle = {},
    closeOnClick = true,
    contentStyle = {},
    keyboard = true,
    modalClassName = '',
    modalStyle = {},
    onShow = () => undefined,
    onHide = () => undefined,
    children = [],
    testId = '',
  },
  ref,
) {
  const contentRef = useRef(null);
  const [willHide, setWillHide] = useState(true);
  const [hidden, setHidden] = useState(true);

  const addTransitionListener = useCallback((node, handle) => {
    if (node) {
      const endListener = (event) => {
        if (event && event.target !== node) {
          return;
        }
        removeEndEventListener(node, endListener);
        handle();
      };
      addEndEventListener(node, endListener);
    }
  }, []);

  const leave = useCallback(() => {
    setHidden(true);
    onHide();
  }, [onHide]);

  const enter = useCallback(() => {
    onShow();
  }, [onShow]);

  const hide = useCallback(() => {
    if (hidden) {
      return;
    }
    setWillHide(true);
  }, [hidden]);

  const show = useCallback(() => {
    if (!hidden) {
      return;
    }

    setWillHide(false);
    setHidden(false);

    setTimeout(() => {
      addTransitionListener(contentRef.current, enter);
    }, 0);
  }, [addTransitionListener, enter, hidden]);

  const closeOnEsc = useCallback(
    (event) => {
      if (keyboard && (event.key === 'Escape' || event.keyCode === 27)) {
        hide();
      }
    },
    [hide, keyboard],
  );

  const listenKeyboard = useCallback(
    (event) => {
      if (typeof keyboard === 'function') {
        keyboard(event);
      } else {
        closeOnEsc(event);
      }
    },
    [closeOnEsc, keyboard],
  );

  useImperativeHandle(ref, () => ({
    show,
    hide,
    hasHidden: () => hidden,
  }));

  useEffect(() => {
    window.addEventListener('keydown', listenKeyboard, true);
    return () => {
      window.removeEventListener('keydown', listenKeyboard, true);
    };
  }, [listenKeyboard]);

  useEffect(() => {
    if (willHide && !hidden && contentRef.current) {
      addTransitionListener(contentRef.current, leave);
    }
  }, [addTransitionListener, hidden, leave, willHide]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnClick) {
      hide();
    }
  }, [closeOnClick, hide]);

  if (hidden) {
    return null;
  }

  const resolvedBackdropStyle = {
    animationName: willHide
      ? animation.hideBackdropAnimation
      : animation.showBackdropAnimation,
    animationTimingFunction: (willHide ? animation.hide : animation.show)
      .animationTimingFunction,
    ...backdropStyle,
  };
  const resolvedContentStyle = {
    animationDuration: (willHide ? animation.hide : animation.show)
      .animationDuration,
    animationName: willHide
      ? animation.hideContentAnimation
      : animation.showContentAnimation,
    animationTimingFunction: (willHide ? animation.hide : animation.show)
      .animationTimingFunction,
    ...contentStyle,
  };

  const backdropElement = backdrop ? (
    <div
      className="modal__backdrop"
      style={resolvedBackdropStyle}
      onClick={closeOnClick ? handleBackdropClick : null}
    />
  ) : undefined;

  return (
    <span>
      <div
        className={`modal${modalClassName ? ` ${modalClassName}` : ''}`}
        style={modalStyle}
        data-testid={testId}
      >
        <div
          className="modal__content"
          ref={contentRef}
          tabIndex="-1"
          style={resolvedContentStyle}
        >
          {children}
        </div>
      </div>
      {backdropElement}
    </span>
  );
});

FadeModal.propTypes = {
  backdrop: PropTypes.bool,
  backdropStyle: PropTypes.object,
  closeOnClick: PropTypes.bool,
  contentStyle: PropTypes.object,
  keyboard: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  modalClassName: PropTypes.string,
  modalStyle: PropTypes.object,
  onShow: PropTypes.func,
  onHide: PropTypes.func,
  children: PropTypes.node,
  testId: PropTypes.string,
};

export default FadeModal;
