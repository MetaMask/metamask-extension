/*
NOTICE:
This Snow + LavaMoat scuttling integration is currently being used
with an experimental API (https://github.com/LavaMoat/LavaMoat/pull/462).
Changing this code must be done cautiously to avoid breaking the app!
*/

// eslint-disable-next-line import/unambiguous
(function () {
  function tameDOM(win) {
    // return;
    function generateTamedWindow(win) {
      return new Proxy(win, {
        get: (a,b,c) => {
          if (b === 'document') {
            return proxy;
          }
          if (![
            "nodeName",
            "Element",
            "HTMLElement",
            "getComputedStyle",
            "visualViewport",
            "addEventListener",
            "removeEventListener",
            "toString",
            "pageXOffset",
            "pageYOffset",
          ].includes(b)) {
            throw 'NOT ALLOWED(window): ' + b;
          }
          let ret = Reflect.get(a,b);
          if (typeof ret === 'function') {
            ret = ret.bind(win);
          }
          return ret;
        }
      });
    }
    function generateTamedDocument(doc, winp) {
      return new Proxy(doc, {
        get: (a,b,c) => {
          if (b === 'defaultView') {
            // return window;
            return winp;
          }
          if (![
              "body",
              "host",
              "shadowRoot",
              "scrollingElement",
              "nodeType",
              "documentElement",
              "activeElement",
              "parentNode",
              "addEventListener",
              "createElement",
              "createElementNS",
              "createTextNode"
            ].includes(b) &&
            !b.startsWith('__reactInternalInstance') &&
            !b.startsWith('__reactContainer')
          ) {
            throw 'NOT ALLOWED(document): ' + b;
          }
          let ret = Reflect.get(a,b);
          if (typeof ret === 'function') {
            ret = ret.bind(doc);
          }
          return ret;
        }
      });
    }
    try {win.Node} catch {return;}
    const {document, Object, Node} = win;
    const winp = generateTamedWindow(win);
    const proxy = generateTamedDocument(document, winp);
    Object.defineProperty(Node.prototype, 'ownerDocument', {get: function() {
        return proxy;
      }}
    );
    const getRootNode = Object.getOwnPropertyDescriptor(Node.prototype, 'getRootNode').value;
    Object.defineProperty(Node.prototype, 'getRootNode', {value: function() {
        const that = this === proxy ? document : this;
        const ret = getRootNode.call(that);
        if (ret === document) {
          return proxy;
        }
        return ret;
      }}
    );
    const parentNode = Object.getOwnPropertyDescriptor(Node.prototype, 'parentNode').get;
    Object.defineProperty(Node.prototype, 'parentNode', {get: function() {
        const that = this === proxy ? document : this;
        const ret = parentNode.call(that);
        if (ret === document) {
          return proxy;
        }
        return ret;
      }}
    );
  }
  const log = console.log.bind(console);
  // eslint-disable-next-line no-undef
  const isWorker = !self.document;
  const msg =
    'Snow detected a new realm creation attempt in MetaMask. Performing scuttling on new realm.';
  // eslint-disable-next-line no-undef
  Object.defineProperty(self, 'SCUTTLER', {
    value: (realm, scuttle) => {
      if (isWorker) {
        scuttle(realm);
      } else {
        // eslint-disable-next-line no-undef
        self.SNOW((win) => {
          log(msg, win);
          tameDOM(win);
          scuttle(win);
        }, realm);
      }
    },
  });
})();
