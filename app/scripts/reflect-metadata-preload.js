try {
  if (typeof Reflect !== 'undefined') {
    if (typeof Reflect.decorate !== 'function') {
      Reflect.decorate = function (decorators, target, propertyKey, attributes) {
        if (Array.isArray(decorators)) {
          let result = target;
          for (let i = decorators.length - 1; i >= 0; i--) {
            if (decorators[i]) {
              result = decorators[i](target, propertyKey, attributes) || result;
            }
          }
          return result;
        }
        return decorators(target, propertyKey, attributes);
      };
    }
    if (typeof Reflect.metadata !== 'function') {
      Reflect.metadata = function (metadataKey, metadataValue) {
        return function (target, propertyKey) {
          return target;
        };
      };
    }
    if (typeof Reflect.defineMetadata !== 'function') {
      const _store = new WeakMap();
      Reflect.defineMetadata = function (k, v, t, p) {
        let m = _store.get(t);
        if (!m) { m = new Map(); _store.set(t, m); }
        m.set(p ? String(p) + ':' + String(k) : String(k), v);
      };
      Reflect.getMetadata = function (k, t, p) {
        const m = _store.get(t);
        return m && m.get(p ? String(p) + ':' + String(k) : String(k));
      };
      Reflect.getOwnMetadata = Reflect.getMetadata;
      Reflect.hasMetadata = function (k, t, p) {
        return Reflect.getMetadata(k, t, p) !== undefined;
      };
      Reflect.hasOwnMetadata = Reflect.hasMetadata;
      Reflect.deleteMetadata = function (k, t, p) {
        const m = _store.get(t);
        return m ? m.delete(p ? String(p) + ':' + String(k) : String(k)) : false;
      };
    }
  }
} catch (e) {}
