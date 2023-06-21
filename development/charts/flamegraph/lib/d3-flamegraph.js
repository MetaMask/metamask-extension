(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof exports === 'object') exports['flamegraph'] = factory();
  else root['flamegraph'] = factory();
})(self, function () {
  return /******/ (() => {
    // webpackBootstrap
    /******/ 'use strict'; // The require scope
    /******/ /******/ var __webpack_require__ = {}; /* webpack/runtime/define property getters */
    /******/
    /************************************************************************/
    /******/ /******/ (() => {
      /******/ // define getter functions for harmony exports
      /******/ __webpack_require__.d = (exports, definition) => {
        /******/ for (var key in definition) {
          /******/ if (
            __webpack_require__.o(definition, key) &&
            !__webpack_require__.o(exports, key)
          ) {
            /******/ Object.defineProperty(exports, key, {
              enumerable: true,
              get: definition[key],
            });
            /******/
          }
          /******/
        }
        /******/
      };
      /******/
    })(); /* webpack/runtime/hasOwnProperty shorthand */
    /******/
    /******/ /******/ (() => {
      /******/ __webpack_require__.o = (obj, prop) =>
        Object.prototype.hasOwnProperty.call(obj, prop);
      /******/
    })();
    /******/
    /************************************************************************/
    var __webpack_exports__ = {};

    // EXPORTS
    __webpack_require__.d(__webpack_exports__, {
      default: () => /* binding */ flamegraph,
    }); // CONCATENATED MODULE: ../node_modules/d3-selection/src/selector.js

    function none() {}

    /* harmony default export */ function selector(selector) {
      return selector == null
        ? none
        : function () {
            return this.querySelector(selector);
          };
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/select.js

    /* harmony default export */ function selection_select(select) {
      if (typeof select !== 'function') select = selector(select);

      for (
        var groups = this._groups,
          m = groups.length,
          subgroups = new Array(m),
          j = 0;
        j < m;
        ++j
      ) {
        for (
          var group = groups[j],
            n = group.length,
            subgroup = (subgroups[j] = new Array(n)),
            node,
            subnode,
            i = 0;
          i < n;
          ++i
        ) {
          if (
            (node = group[i]) &&
            (subnode = select.call(node, node.__data__, i, group))
          ) {
            if ('__data__' in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection(subgroups, this._parents);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/array.js

    // Given something array like (or null), returns something that is strictly an
    // array. This is used to ensure that array-like objects passed to d3.selectAll
    // or selection.selectAll are converted into proper arrays when creating a
    // selection; we don’t ever want to create a selection backed by a live
    // HTMLCollection or NodeList. However, note that selection.selectAll will use a
    // static NodeList as a group, since it safely derived from querySelectorAll.
    function array(x) {
      return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selectorAll.js

    function empty() {
      return [];
    }

    /* harmony default export */ function selectorAll(selector) {
      return selector == null
        ? empty
        : function () {
            return this.querySelectorAll(selector);
          };
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/selectAll.js

    function arrayAll(select) {
      return function () {
        return array(select.apply(this, arguments));
      };
    }

    /* harmony default export */ function selectAll(select) {
      if (typeof select === 'function') select = arrayAll(select);
      else select = selectorAll(select);

      for (
        var groups = this._groups,
          m = groups.length,
          subgroups = [],
          parents = [],
          j = 0;
        j < m;
        ++j
      ) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if ((node = group[i])) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection(subgroups, parents);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/matcher.js

    /* harmony default export */ function matcher(selector) {
      return function () {
        return this.matches(selector);
      };
    }

    function childMatcher(selector) {
      return function (node) {
        return node.matches(selector);
      };
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/selectChild.js

    var find = Array.prototype.find;

    function childFind(match) {
      return function () {
        return find.call(this.children, match);
      };
    }

    function childFirst() {
      return this.firstElementChild;
    }

    /* harmony default export */ function selectChild(match) {
      return this.select(
        match == null
          ? childFirst
          : childFind(
              typeof match === 'function' ? match : childMatcher(match),
            ),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/selectChildren.js

    var filter = Array.prototype.filter;

    function children() {
      return Array.from(this.children);
    }

    function childrenFilter(match) {
      return function () {
        return filter.call(this.children, match);
      };
    }

    /* harmony default export */ function selectChildren(match) {
      return this.selectAll(
        match == null
          ? children
          : childrenFilter(
              typeof match === 'function' ? match : childMatcher(match),
            ),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/filter.js

    /* harmony default export */ function selection_filter(match) {
      if (typeof match !== 'function') match = matcher(match);

      for (
        var groups = this._groups,
          m = groups.length,
          subgroups = new Array(m),
          j = 0;
        j < m;
        ++j
      ) {
        for (
          var group = groups[j],
            n = group.length,
            subgroup = (subgroups[j] = []),
            node,
            i = 0;
          i < n;
          ++i
        ) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Selection(subgroups, this._parents);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/sparse.js

    /* harmony default export */ function sparse(update) {
      return new Array(update.length);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/enter.js

    /* harmony default export */ function enter() {
      return new Selection(
        this._enter || this._groups.map(sparse),
        this._parents,
      );
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function (child) {
        return this._parent.insertBefore(child, this._next);
      },
      insertBefore: function (child, next) {
        return this._parent.insertBefore(child, next);
      },
      querySelector: function (selector) {
        return this._parent.querySelector(selector);
      },
      querySelectorAll: function (selector) {
        return this._parent.querySelectorAll(selector);
      },
    }; // CONCATENATED MODULE: ../node_modules/d3-selection/src/constant.js

    /* harmony default export */ function src_constant(x) {
      return function () {
        return x;
      };
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/data.js

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if ((node = group[i])) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if ((node = group[i])) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
        node,
        nodeByKeyValue = new Map(),
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i])) {
          keyValues[i] = keyValue =
            key.call(node, node.__data__, i, group) + '';
          if (nodeByKeyValue.has(keyValue)) {
            exit[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = key.call(parent, data[i], i, data) + '';
        if ((node = nodeByKeyValue.get(keyValue))) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue.delete(keyValue);
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
          exit[i] = node;
        }
      }
    }

    function datum(node) {
      return node.__data__;
    }

    /* harmony default export */ function data(value, key) {
      if (!arguments.length) return Array.from(this, datum);

      var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

      if (typeof value !== 'function') value = src_constant(value);

      for (
        var m = groups.length,
          update = new Array(m),
          enter = new Array(m),
          exit = new Array(m),
          j = 0;
        j < m;
        ++j
      ) {
        var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = arraylike(
            value.call(parent, parent && parent.__data__, j, parents),
          ),
          dataLength = data.length,
          enterGroup = (enter[j] = new Array(dataLength)),
          updateGroup = (update[j] = new Array(dataLength)),
          exitGroup = (exit[j] = new Array(groupLength));

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if ((previous = enterGroup[i0])) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength);
            previous._next = next || null;
          }
        }
      }

      update = new Selection(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    // Given some data, this returns an array-like view of it: an object that
    // exposes a length property and allows numeric indexing. Note that unlike
    // selectAll, this isn’t worried about “live” collections because the resulting
    // array will only be used briefly while data is being bound. (It is possible to
    // cause the data to change while iterating by using a key function, but please
    // don’t; we’d rather avoid a gratuitous copy.)
    function arraylike(data) {
      return typeof data === 'object' && 'length' in data
        ? data // Array, TypedArray, NodeList, array-like
        : Array.from(data); // Map, Set, iterable, string, or anything else
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/exit.js

    /* harmony default export */ function exit() {
      return new Selection(
        this._exit || this._groups.map(sparse),
        this._parents,
      );
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/join.js

    /* harmony default export */ function join(onenter, onupdate, onexit) {
      var enter = this.enter(),
        update = this,
        exit = this.exit();
      if (typeof onenter === 'function') {
        enter = onenter(enter);
        if (enter) enter = enter.selection();
      } else {
        enter = enter.append(onenter + '');
      }
      if (onupdate != null) {
        update = onupdate(update);
        if (update) update = update.selection();
      }
      if (onexit == null) exit.remove();
      else onexit(exit);
      return enter && update ? enter.merge(update).order() : update;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/merge.js

    /* harmony default export */ function merge(context) {
      var selection = context.selection ? context.selection() : context;

      for (
        var groups0 = this._groups,
          groups1 = selection._groups,
          m0 = groups0.length,
          m1 = groups1.length,
          m = Math.min(m0, m1),
          merges = new Array(m0),
          j = 0;
        j < m;
        ++j
      ) {
        for (
          var group0 = groups0[j],
            group1 = groups1[j],
            n = group0.length,
            merge = (merges[j] = new Array(n)),
            node,
            i = 0;
          i < n;
          ++i
        ) {
          if ((node = group0[i] || group1[i])) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection(merges, this._parents);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/order.js

    /* harmony default export */ function order() {
      for (var groups = this._groups, j = -1, m = groups.length; ++j < m; ) {
        for (
          var group = groups[j], i = group.length - 1, next = group[i], node;
          --i >= 0;

        ) {
          if ((node = group[i])) {
            if (next && node.compareDocumentPosition(next) ^ 4)
              next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/sort.js

    /* harmony default export */ function sort(compare) {
      if (!compare) compare = ascending;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (
        var groups = this._groups,
          m = groups.length,
          sortgroups = new Array(m),
          j = 0;
        j < m;
        ++j
      ) {
        for (
          var group = groups[j],
            n = group.length,
            sortgroup = (sortgroups[j] = new Array(n)),
            node,
            i = 0;
          i < n;
          ++i
        ) {
          if ((node = group[i])) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection(sortgroups, this._parents).order();
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/call.js

    /* harmony default export */ function call() {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/nodes.js

    /* harmony default export */ function nodes() {
      return Array.from(this);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/node.js

    /* harmony default export */ function node() {
      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/size.js

    /* harmony default export */ function size() {
      let size = 0;
      for (const node of this) ++size; // eslint-disable-line no-unused-vars
      return size;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/empty.js

    /* harmony default export */ function selection_empty() {
      return !this.node();
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/each.js

    /* harmony default export */ function each(callback) {
      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if ((node = group[i])) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/namespaces.js

    var xhtml = 'http://www.w3.org/1999/xhtml';

    /* harmony default export */ const namespaces = {
      svg: 'http://www.w3.org/2000/svg',
      xhtml: xhtml,
      xlink: 'http://www.w3.org/1999/xlink',
      xml: 'http://www.w3.org/XML/1998/namespace',
      xmlns: 'http://www.w3.org/2000/xmlns/',
    }; // CONCATENATED MODULE: ../node_modules/d3-selection/src/namespace.js

    /* harmony default export */ function namespace(name) {
      var prefix = (name += ''),
        i = prefix.indexOf(':');
      if (i >= 0 && (prefix = name.slice(0, i)) !== 'xmlns')
        name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix)
        ? { space: namespaces[prefix], local: name }
        : name; // eslint-disable-line no-prototype-builtins
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/attr.js

    function attrRemove(name) {
      return function () {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function () {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, value) {
      return function () {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS(fullname, value) {
      return function () {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction(name, value) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS(fullname, value) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    /* harmony default export */ function attr(name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
      }

      return this.each(
        (value == null
          ? fullname.local
            ? attrRemoveNS
            : attrRemove
          : typeof value === 'function'
          ? fullname.local
            ? attrFunctionNS
            : attrFunction
          : fullname.local
          ? attrConstantNS
          : attrConstant)(fullname, value),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/window.js

    /* harmony default export */ function src_window(node) {
      return (
        (node.ownerDocument && node.ownerDocument.defaultView) || // node is a Node
        (node.document && node) || // node is a Window
        node.defaultView
      ); // node is a Document
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/style.js

    function styleRemove(name) {
      return function () {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, value, priority) {
      return function () {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction(name, value, priority) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);
        else this.style.setProperty(name, v, priority);
      };
    }

    /* harmony default export */ function style(name, value, priority) {
      return arguments.length > 1
        ? this.each(
            (value == null
              ? styleRemove
              : typeof value === 'function'
              ? styleFunction
              : styleConstant)(name, value, priority == null ? '' : priority),
          )
        : styleValue(this.node(), name);
    }

    function styleValue(node, name) {
      return (
        node.style.getPropertyValue(name) ||
        src_window(node).getComputedStyle(node, null).getPropertyValue(name)
      );
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/property.js

    function propertyRemove(name) {
      return function () {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function () {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];
        else this[name] = v;
      };
    }

    /* harmony default export */ function property(name, value) {
      return arguments.length > 1
        ? this.each(
            (value == null
              ? propertyRemove
              : typeof value === 'function'
              ? propertyFunction
              : propertyConstant)(name, value),
          )
        : this.node()[name];
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/classed.js

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute('class') || '');
    }

    ClassList.prototype = {
      add: function (name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute('class', this._names.join(' '));
        }
      },
      remove: function (name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute('class', this._names.join(' '));
        }
      },
      contains: function (name) {
        return this._names.indexOf(name) >= 0;
      },
    };

    function classedAdd(node, names) {
      var list = classList(node),
        i = -1,
        n = names.length;
      while (++i < n) list.add(names[i]);
    }

    function classedRemove(node, names) {
      var list = classList(node),
        i = -1,
        n = names.length;
      while (++i < n) list.remove(names[i]);
    }

    function classedTrue(names) {
      return function () {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function () {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function () {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(
          this,
          names,
        );
      };
    }

    /* harmony default export */ function classed(name, value) {
      var names = classArray(name + '');

      if (arguments.length < 2) {
        var list = classList(this.node()),
          i = -1,
          n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
      }

      return this.each(
        (typeof value === 'function'
          ? classedFunction
          : value
          ? classedTrue
          : classedFalse)(names, value),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/text.js

    function textRemove() {
      this.textContent = '';
    }

    function textConstant(value) {
      return function () {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function () {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? '' : v;
      };
    }

    /* harmony default export */ function selection_text(value) {
      return arguments.length
        ? this.each(
            value == null
              ? textRemove
              : (typeof value === 'function' ? textFunction : textConstant)(
                  value,
                ),
          )
        : this.node().textContent;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/html.js

    function htmlRemove() {
      this.innerHTML = '';
    }

    function htmlConstant(value) {
      return function () {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function () {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? '' : v;
      };
    }

    /* harmony default export */ function html(value) {
      return arguments.length
        ? this.each(
            value == null
              ? htmlRemove
              : (typeof value === 'function' ? htmlFunction : htmlConstant)(
                  value,
                ),
          )
        : this.node().innerHTML;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/raise.js

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    /* harmony default export */ function selection_raise() {
      return this.each(raise);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/lower.js

    function lower() {
      if (this.previousSibling)
        this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    /* harmony default export */ function selection_lower() {
      return this.each(lower);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/creator.js

    function creatorInherit(name) {
      return function () {
        var document = this.ownerDocument,
          uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function () {
        return this.ownerDocument.createElementNS(
          fullname.space,
          fullname.local,
        );
      };
    }

    /* harmony default export */ function creator(name) {
      var fullname = namespace(name);
      return (fullname.local ? creatorFixed : creatorInherit)(fullname);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/append.js

    /* harmony default export */ function append(name) {
      var create = typeof name === 'function' ? name : creator(name);
      return this.select(function () {
        return this.appendChild(create.apply(this, arguments));
      });
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/insert.js

    function constantNull() {
      return null;
    }

    /* harmony default export */ function insert(name, before) {
      var create = typeof name === 'function' ? name : creator(name),
        select =
          before == null
            ? constantNull
            : typeof before === 'function'
            ? before
            : selector(before);
      return this.select(function () {
        return this.insertBefore(
          create.apply(this, arguments),
          select.apply(this, arguments) || null,
        );
      });
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/remove.js

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    /* harmony default export */ function selection_remove() {
      return this.each(remove);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/clone.js

    function selection_cloneShallow() {
      var clone = this.cloneNode(false),
        parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_cloneDeep() {
      var clone = this.cloneNode(true),
        parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    /* harmony default export */ function clone(deep) {
      return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/datum.js

    /* harmony default export */ function selection_datum(value) {
      return arguments.length
        ? this.property('__data__', value)
        : this.node().__data__;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/on.js

    function contextListener(listener) {
      return function (event) {
        listener.call(this, event, this.__data__);
      };
    }

    function parseTypenames(typenames) {
      return typenames
        .trim()
        .split(/^|\s+/)
        .map(function (t) {
          var name = '',
            i = t.indexOf('.');
          if (i >= 0) (name = t.slice(i + 1)), (t = t.slice(0, i));
          return { type: t, name: name };
        });
    }

    function onRemove(typename) {
      return function () {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (
            ((o = on[j]),
            (!typename.type || o.type === typename.type) &&
              o.name === typename.name)
          ) {
            this.removeEventListener(o.type, o.listener, o.options);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;
        else delete this.__on;
      };
    }

    function onAdd(typename, value, options) {
      return function () {
        var on = this.__on,
          o,
          listener = contextListener(value);
        if (on)
          for (var j = 0, m = on.length; j < m; ++j) {
            if (
              (o = on[j]).type === typename.type &&
              o.name === typename.name
            ) {
              this.removeEventListener(o.type, o.listener, o.options);
              this.addEventListener(
                o.type,
                (o.listener = listener),
                (o.options = options),
              );
              o.value = value;
              return;
            }
          }
        this.addEventListener(typename.type, listener, options);
        o = {
          type: typename.type,
          name: typename.name,
          value: value,
          listener: listener,
          options: options,
        };
        if (!on) this.__on = [o];
        else on.push(o);
      };
    }

    /* harmony default export */ function on(typename, value, options) {
      var typenames = parseTypenames(typename + ''),
        i,
        n = typenames.length,
        t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on)
          for (var j = 0, m = on.length, o; j < m; ++j) {
            for (i = 0, o = on[j]; i < n; ++i) {
              if ((t = typenames[i]).type === o.type && t.name === o.name) {
                return o.value;
              }
            }
          }
        return;
      }

      on = value ? onAdd : onRemove;
      for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/dispatch.js

    function dispatchEvent(node, type, params) {
      var window = src_window(node),
        event = window.CustomEvent;

      if (typeof event === 'function') {
        event = new event(type, params);
      } else {
        event = window.document.createEvent('Event');
        if (params)
          event.initEvent(type, params.bubbles, params.cancelable),
            (event.detail = params.detail);
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function () {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function () {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    /* harmony default export */ function dispatch(type, params) {
      return this.each(
        (typeof params === 'function' ? dispatchFunction : dispatchConstant)(
          type,
          params,
        ),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/iterator.js

    /* harmony default export */ function* iterator() {
      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if ((node = group[i])) yield node;
        }
      }
    } // CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/index.js

    var root = [null];

    function Selection(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection([[document.documentElement]], root);
    }

    function selection_selection() {
      return this;
    }

    Selection.prototype = selection.prototype = {
      constructor: Selection,
      select: selection_select,
      selectAll: selectAll,
      selectChild: selectChild,
      selectChildren: selectChildren,
      filter: selection_filter,
      data: data,
      enter: enter,
      exit: exit,
      join: join,
      merge: merge,
      selection: selection_selection,
      order: order,
      sort: sort,
      call: call,
      nodes: nodes,
      node: node,
      size: size,
      empty: selection_empty,
      each: each,
      attr: attr,
      style: style,
      property: property,
      classed: classed,
      text: selection_text,
      html: html,
      raise: selection_raise,
      lower: selection_lower,
      append: append,
      insert: insert,
      remove: selection_remove,
      clone: clone,
      datum: selection_datum,
      on: on,
      dispatch: dispatch,
      [Symbol.iterator]: iterator,
    };

    /* harmony default export */ const src_selection = selection; // CONCATENATED MODULE: ../node_modules/d3-selection/src/select.js

    /* harmony default export */ function src_select(selector) {
      return typeof selector === 'string'
        ? new Selection(
            [[document.querySelector(selector)]],
            [document.documentElement],
          )
        : new Selection([[selector]], root);
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/formatDecimal.js

    /* harmony default export */ function formatDecimal(x) {
      return Math.abs((x = Math.round(x))) >= 1e21
        ? x.toLocaleString('en').replace(/,/g, '')
        : x.toString(10);
    }

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimalParts(1.23) returns ["123", 0].
    function formatDecimalParts(x, p) {
      if (
        (i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf(
          'e',
        )) < 0
      )
        return null; // NaN, ±Infinity
      var i,
        coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1
          ? coefficient[0] + coefficient.slice(2)
          : coefficient,
        +x.slice(i + 1),
      ];
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/exponent.js

    /* harmony default export */ function exponent(x) {
      return (x = formatDecimalParts(Math.abs(x))), x ? x[1] : NaN;
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/formatGroup.js

    /* harmony default export */ function formatGroup(grouping, thousands) {
      return function (value, width) {
        var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring((i -= g), i + g));
          if ((length += g + 1) > width) break;
          g = grouping[(j = (j + 1) % grouping.length)];
        }

        return t.reverse().join(thousands);
      };
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/formatNumerals.js

    /* harmony default export */ function formatNumerals(numerals) {
      return function (value) {
        return value.replace(/[0-9]/g, function (i) {
          return numerals[+i];
        });
      };
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/formatSpecifier.js

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier)))
        throw new Error('invalid format: ' + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10],
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? ' ' : specifier.fill + '';
      this.align = specifier.align === undefined ? '>' : specifier.align + '';
      this.sign = specifier.sign === undefined ? '-' : specifier.sign + '';
      this.symbol = specifier.symbol === undefined ? '' : specifier.symbol + '';
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision =
        specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? '' : specifier.type + '';
    }

    FormatSpecifier.prototype.toString = function () {
      return (
        this.fill +
        this.align +
        this.sign +
        this.symbol +
        (this.zero ? '0' : '') +
        (this.width === undefined ? '' : Math.max(1, this.width | 0)) +
        (this.comma ? ',' : '') +
        (this.precision === undefined
          ? ''
          : '.' + Math.max(0, this.precision | 0)) +
        (this.trim ? '~' : '') +
        this.type
      );
    }; // CONCATENATED MODULE: ../node_modules/d3-format/src/formatTrim.js

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    /* harmony default export */ function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case '.':
            i0 = i1 = i;
            break;
          case '0':
            if (i0 === 0) i0 = i;
            i1 = i;
            break;
          default:
            if (!+s[i]) break out;
            if (i0 > 0) i0 = 0;
            break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/formatPrefixAuto.js

    var prefixExponent;

    /* harmony default export */ function formatPrefixAuto(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + '';
      var coefficient = d[0],
        exponent = d[1],
        i =
          exponent -
          (prefixExponent =
            Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) +
          1,
        n = coefficient.length;
      return i === n
        ? coefficient
        : i > n
        ? coefficient + new Array(i - n + 1).join('0')
        : i > 0
        ? coefficient.slice(0, i) + '.' + coefficient.slice(i)
        : '0.' +
          new Array(1 - i).join('0') +
          formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/formatRounded.js

    /* harmony default export */ function formatRounded(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + '';
      var coefficient = d[0],
        exponent = d[1];
      return exponent < 0
        ? '0.' + new Array(-exponent).join('0') + coefficient
        : coefficient.length > exponent + 1
        ? coefficient.slice(0, exponent + 1) +
          '.' +
          coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join('0');
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/formatTypes.js

    /* harmony default export */ const formatTypes = {
      '%': (x, p) => (x * 100).toFixed(p),
      b: (x) => Math.round(x).toString(2),
      c: (x) => x + '',
      d: formatDecimal,
      e: (x, p) => x.toExponential(p),
      f: (x, p) => x.toFixed(p),
      g: (x, p) => x.toPrecision(p),
      o: (x) => Math.round(x).toString(8),
      p: (x, p) => formatRounded(x * 100, p),
      r: formatRounded,
      s: formatPrefixAuto,
      X: (x) => Math.round(x).toString(16).toUpperCase(),
      x: (x) => Math.round(x).toString(16),
    }; // CONCATENATED MODULE: ../node_modules/d3-format/src/identity.js

    /* harmony default export */ function identity(x) {
      return x;
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/locale.js

    var map = Array.prototype.map,
      prefixes = [
        'y',
        'z',
        'a',
        'f',
        'p',
        'n',
        'µ',
        'm',
        '',
        'k',
        'M',
        'G',
        'T',
        'P',
        'E',
        'Z',
        'Y',
      ];

    /* harmony default export */ function locale(locale) {
      var group =
          locale.grouping === undefined || locale.thousands === undefined
            ? identity
            : formatGroup(
                map.call(locale.grouping, Number),
                locale.thousands + '',
              ),
        currencyPrefix =
          locale.currency === undefined ? '' : locale.currency[0] + '',
        currencySuffix =
          locale.currency === undefined ? '' : locale.currency[1] + '',
        decimal = locale.decimal === undefined ? '.' : locale.decimal + '',
        numerals =
          locale.numerals === undefined
            ? identity
            : formatNumerals(map.call(locale.numerals, String)),
        percent = locale.percent === undefined ? '%' : locale.percent + '',
        minus = locale.minus === undefined ? '−' : locale.minus + '',
        nan = locale.nan === undefined ? 'NaN' : locale.nan + '';

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          trim = specifier.trim,
          type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === 'n') (comma = true), (type = 'g');
        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type])
          precision === undefined && (precision = 12),
            (trim = true),
            (type = 'g');

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === '0' && align === '='))
          (zero = true), (fill = '0'), (align = '=');

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix =
            symbol === '$'
              ? currencyPrefix
              : symbol === '#' && /[boxX]/.test(type)
              ? '0' + type.toLowerCase()
              : '',
          suffix =
            symbol === '$' ? currencySuffix : /[%p]/.test(type) ? percent : '';

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
          maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision =
          precision === undefined
            ? 6
            : /[gprs]/.test(type)
            ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
            valueSuffix = suffix,
            i,
            n,
            c;

          if (type === 'c') {
            valueSuffix = formatType(value) + valueSuffix;
            value = '';
          } else {
            value = +value;

            // Determine the sign. -0 is not less than 0, but 1 / -0 is!
            var valueNegative = value < 0 || 1 / value < 0;

            // Perform the initial formatting.
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
            if (valueNegative && +value === 0 && sign !== '+')
              valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix =
              (valueNegative
                ? sign === '('
                  ? sign
                  : minus
                : sign === '-' || sign === '('
                ? ''
                : sign) + valuePrefix;
            valueSuffix =
              (type === 's' ? prefixes[8 + prefixExponent / 3] : '') +
              valueSuffix +
              (valueNegative && sign === '(' ? ')' : '');

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              (i = -1), (n = value.length);
              while (++i < n) {
                if (((c = value.charCodeAt(i)), 48 > c || c > 57)) {
                  valueSuffix =
                    (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) +
                    valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
            padding =
              length < width ? new Array(width - length + 1).join(fill) : '';

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero)
            (value = group(
              padding + value,
              padding.length ? width - valueSuffix.length : Infinity,
            )),
              (padding = '');

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case '<':
              value = valuePrefix + value + valueSuffix + padding;
              break;
            case '=':
              value = valuePrefix + padding + value + valueSuffix;
              break;
            case '^':
              value =
                padding.slice(0, (length = padding.length >> 1)) +
                valuePrefix +
                value +
                valueSuffix +
                padding.slice(length);
              break;
            default:
              value = padding + valuePrefix + value + valueSuffix;
              break;
          }

          return numerals(value);
        }

        format.toString = function () {
          return specifier + '';
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat(
            ((specifier = formatSpecifier(specifier)),
            (specifier.type = 'f'),
            specifier),
          ),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
        return function (value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix,
      };
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/defaultLocale.js

    var defaultLocale_locale;
    var format;
    var formatPrefix;

    defaultLocale({
      thousands: ',',
      grouping: [3],
      currency: ['$', ''],
    });

    function defaultLocale(definition) {
      defaultLocale_locale = locale(definition);
      format = defaultLocale_locale.format;
      formatPrefix = defaultLocale_locale.formatPrefix;
      return defaultLocale_locale;
    } // CONCATENATED MODULE: ../node_modules/d3-array/src/ascending.js

    function ascending_ascending(a, b) {
      return a == null || b == null
        ? NaN
        : a < b
        ? -1
        : a > b
        ? 1
        : a >= b
        ? 0
        : NaN;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/treemap/round.js

    /* harmony default export */ function treemap_round(node) {
      node.x0 = Math.round(node.x0);
      node.y0 = Math.round(node.y0);
      node.x1 = Math.round(node.x1);
      node.y1 = Math.round(node.y1);
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/treemap/dice.js

    /* harmony default export */ function dice(parent, x0, y0, x1, y1) {
      var nodes = parent.children,
        node,
        i = -1,
        n = nodes.length,
        k = parent.value && (x1 - x0) / parent.value;

      while (++i < n) {
        (node = nodes[i]), (node.y0 = y0), (node.y1 = y1);
        (node.x0 = x0), (node.x1 = x0 += node.value * k);
      }
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/partition.js

    /* harmony default export */ function partition() {
      var dx = 1,
        dy = 1,
        padding = 0,
        round = false;

      function partition(root) {
        var n = root.height + 1;
        root.x0 = root.y0 = padding;
        root.x1 = dx;
        root.y1 = dy / n;
        root.eachBefore(positionNode(dy, n));
        if (round) root.eachBefore(treemap_round);
        return root;
      }

      function positionNode(dy, n) {
        return function (node) {
          if (node.children) {
            dice(
              node,
              node.x0,
              (dy * (node.depth + 1)) / n,
              node.x1,
              (dy * (node.depth + 2)) / n,
            );
          }
          var x0 = node.x0,
            y0 = node.y0,
            x1 = node.x1 - padding,
            y1 = node.y1 - padding;
          if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
          if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
          node.x0 = x0;
          node.y0 = y0;
          node.x1 = x1;
          node.y1 = y1;
        };
      }

      partition.round = function (x) {
        return arguments.length ? ((round = !!x), partition) : round;
      };

      partition.size = function (x) {
        return arguments.length
          ? ((dx = +x[0]), (dy = +x[1]), partition)
          : [dx, dy];
      };

      partition.padding = function (x) {
        return arguments.length ? ((padding = +x), partition) : padding;
      };

      return partition;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/count.js

    function count(node) {
      var sum = 0,
        children = node.children,
        i = children && children.length;
      if (!i) sum = 1;
      else while (--i >= 0) sum += children[i].value;
      node.value = sum;
    }

    /* harmony default export */ function hierarchy_count() {
      return this.eachAfter(count);
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/each.js

    /* harmony default export */ function hierarchy_each(callback, that) {
      let index = -1;
      for (const node of this) {
        callback.call(that, node, ++index, this);
      }
      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/eachBefore.js

    /* harmony default export */ function eachBefore(callback, that) {
      var node = this,
        nodes = [node],
        children,
        i,
        index = -1;
      while ((node = nodes.pop())) {
        callback.call(that, node, ++index, this);
        if ((children = node.children)) {
          for (i = children.length - 1; i >= 0; --i) {
            nodes.push(children[i]);
          }
        }
      }
      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/eachAfter.js

    /* harmony default export */ function eachAfter(callback, that) {
      var node = this,
        nodes = [node],
        next = [],
        children,
        i,
        n,
        index = -1;
      while ((node = nodes.pop())) {
        next.push(node);
        if ((children = node.children)) {
          for (i = 0, n = children.length; i < n; ++i) {
            nodes.push(children[i]);
          }
        }
      }
      while ((node = next.pop())) {
        callback.call(that, node, ++index, this);
      }
      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/find.js

    /* harmony default export */ function hierarchy_find(callback, that) {
      let index = -1;
      for (const node of this) {
        if (callback.call(that, node, ++index, this)) {
          return node;
        }
      }
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/sum.js

    /* harmony default export */ function sum(value) {
      return this.eachAfter(function (node) {
        var sum = +value(node.data) || 0,
          children = node.children,
          i = children && children.length;
        while (--i >= 0) sum += children[i].value;
        node.value = sum;
      });
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/sort.js

    /* harmony default export */ function hierarchy_sort(compare) {
      return this.eachBefore(function (node) {
        if (node.children) {
          node.children.sort(compare);
        }
      });
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/path.js

    /* harmony default export */ function path(end) {
      var start = this,
        ancestor = leastCommonAncestor(start, end),
        nodes = [start];
      while (start !== ancestor) {
        start = start.parent;
        nodes.push(start);
      }
      var k = nodes.length;
      while (end !== ancestor) {
        nodes.splice(k, 0, end);
        end = end.parent;
      }
      return nodes;
    }

    function leastCommonAncestor(a, b) {
      if (a === b) return a;
      var aNodes = a.ancestors(),
        bNodes = b.ancestors(),
        c = null;
      a = aNodes.pop();
      b = bNodes.pop();
      while (a === b) {
        c = a;
        a = aNodes.pop();
        b = bNodes.pop();
      }
      return c;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/ancestors.js

    /* harmony default export */ function ancestors() {
      var node = this,
        nodes = [node];
      while ((node = node.parent)) {
        nodes.push(node);
      }
      return nodes;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/descendants.js

    /* harmony default export */ function descendants() {
      return Array.from(this);
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/leaves.js

    /* harmony default export */ function leaves() {
      var leaves = [];
      this.eachBefore(function (node) {
        if (!node.children) {
          leaves.push(node);
        }
      });
      return leaves;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/links.js

    /* harmony default export */ function links() {
      var root = this,
        links = [];
      root.each(function (node) {
        if (node !== root) {
          // Don’t include the root’s parent, if any.
          links.push({ source: node.parent, target: node });
        }
      });
      return links;
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/iterator.js

    /* harmony default export */ function* hierarchy_iterator() {
      var node = this,
        current,
        next = [node],
        children,
        i,
        n;
      do {
        (current = next.reverse()), (next = []);
        while ((node = current.pop())) {
          yield node;
          if ((children = node.children)) {
            for (i = 0, n = children.length; i < n; ++i) {
              next.push(children[i]);
            }
          }
        }
      } while (next.length);
    } // CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/index.js

    function hierarchy(data, children) {
      if (data instanceof Map) {
        data = [undefined, data];
        if (children === undefined) children = mapChildren;
      } else if (children === undefined) {
        children = objectChildren;
      }

      var root = new Node(data),
        node,
        nodes = [root],
        child,
        childs,
        i,
        n;

      while ((node = nodes.pop())) {
        if (
          (childs = children(node.data)) &&
          (n = (childs = Array.from(childs)).length)
        ) {
          node.children = childs;
          for (i = n - 1; i >= 0; --i) {
            nodes.push((child = childs[i] = new Node(childs[i])));
            child.parent = node;
            child.depth = node.depth + 1;
          }
        }
      }

      return root.eachBefore(computeHeight);
    }

    function node_copy() {
      return hierarchy(this).eachBefore(copyData);
    }

    function objectChildren(d) {
      return d.children;
    }

    function mapChildren(d) {
      return Array.isArray(d) ? d[1] : null;
    }

    function copyData(node) {
      if (node.data.value !== undefined) node.value = node.data.value;
      node.data = node.data.data;
    }

    function computeHeight(node) {
      var height = 0;
      do node.height = height;
      while ((node = node.parent) && node.height < ++height);
    }

    function Node(data) {
      this.data = data;
      this.depth = this.height = 0;
      this.parent = null;
    }

    Node.prototype = hierarchy.prototype = {
      constructor: Node,
      count: hierarchy_count,
      each: hierarchy_each,
      eachAfter: eachAfter,
      eachBefore: eachBefore,
      find: hierarchy_find,
      sum: sum,
      sort: hierarchy_sort,
      path: path,
      ancestors: ancestors,
      descendants: descendants,
      leaves: leaves,
      links: links,
      copy: node_copy,
      [Symbol.iterator]: hierarchy_iterator,
    }; // CONCATENATED MODULE: ../node_modules/d3-array/src/ticks.js

    var e10 = Math.sqrt(50),
      e5 = Math.sqrt(10),
      e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
        i = -1,
        n,
        ticks,
        step;

      (stop = +stop), (start = +start), (count = +count);
      if (start === stop && count > 0) return [start];
      if ((reverse = stop < start)) (n = start), (start = stop), (stop = n);
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step))
        return [];

      if (step > 0) {
        let r0 = Math.round(start / step),
          r1 = Math.round(stop / step);
        if (r0 * step < start) ++r0;
        if (r1 * step > stop) --r1;
        ticks = new Array((n = r1 - r0 + 1));
        while (++i < n) ticks[i] = (r0 + i) * step;
      } else {
        step = -step;
        let r0 = Math.round(start * step),
          r1 = Math.round(stop * step);
        if (r0 / step < start) ++r0;
        if (r1 / step > stop) --r1;
        ticks = new Array((n = r1 - r0 + 1));
        while (++i < n) ticks[i] = (r0 + i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
        power = Math.floor(Math.log(step) / Math.LN10),
        error = step / Math.pow(10, power);
      return power >= 0
        ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) *
            Math.pow(10, power)
        : -Math.pow(10, -power) /
            (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    } // CONCATENATED MODULE: ../node_modules/d3-array/src/bisector.js

    function bisector(f) {
      let delta = f;
      let compare1 = f;
      let compare2 = f;

      if (f.length !== 2) {
        delta = (d, x) => f(d) - x;
        compare1 = ascending_ascending;
        compare2 = (d, x) => ascending_ascending(f(d), x);
      }

      function left(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = (lo + hi) >>> 1;
            if (compare2(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }

      function right(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = (lo + hi) >>> 1;
            if (compare2(a[mid], x) <= 0) lo = mid + 1;
            else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }

      function center(a, x, lo = 0, hi = a.length) {
        const i = left(a, x, lo, hi - 1);
        return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
      }

      return { left, center, right };
    } // CONCATENATED MODULE: ../node_modules/d3-array/src/number.js

    function number(x) {
      return x === null ? NaN : +x;
    }

    function* numbers(values, valueof) {
      if (valueof === undefined) {
        for (let value of values) {
          if (value != null && (value = +value) >= value) {
            yield value;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if (
            (value = valueof(value, ++index, values)) != null &&
            (value = +value) >= value
          ) {
            yield value;
          }
        }
      }
    } // CONCATENATED MODULE: ../node_modules/d3-array/src/bisect.js

    const ascendingBisect = bisector(ascending_ascending);
    const bisectRight = ascendingBisect.right;
    const bisectLeft = ascendingBisect.left;
    const bisectCenter = bisector(number).center;
    /* harmony default export */ const bisect = bisectRight; // CONCATENATED MODULE: ../node_modules/d3-color/src/define.js

    /* harmony default export */ function src_define(
      constructor,
      factory,
      prototype,
    ) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    } // CONCATENATED MODULE: ../node_modules/d3-color/src/color.js

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = '\\s*([+-]?\\d+)\\s*',
      reN = '\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*',
      reP = '\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*',
      reHex = /^#([0-9a-f]{3,8})$/,
      reRgbInteger = new RegExp('^rgb\\(' + [reI, reI, reI] + '\\)$'),
      reRgbPercent = new RegExp('^rgb\\(' + [reP, reP, reP] + '\\)$'),
      reRgbaInteger = new RegExp('^rgba\\(' + [reI, reI, reI, reN] + '\\)$'),
      reRgbaPercent = new RegExp('^rgba\\(' + [reP, reP, reP, reN] + '\\)$'),
      reHslPercent = new RegExp('^hsl\\(' + [reN, reP, reP] + '\\)$'),
      reHslaPercent = new RegExp('^hsla\\(' + [reN, reP, reP, reN] + '\\)$');

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32,
    };

    src_define(Color, color, {
      copy: function (channels) {
        return Object.assign(new this.constructor(), this, channels);
      },
      displayable: function () {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb,
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + '').trim().toLowerCase();
      return (m = reHex.exec(format))
        ? ((l = m[1].length),
          (m = parseInt(m[1], 16)),
          l === 6
            ? rgbn(m) // #ff0000
            : l === 3
            ? new Rgb(
                ((m >> 8) & 0xf) | ((m >> 4) & 0xf0),
                ((m >> 4) & 0xf) | (m & 0xf0),
                ((m & 0xf) << 4) | (m & 0xf),
                1,
              ) // #f00
            : l === 8
            ? rgba(
                (m >> 24) & 0xff,
                (m >> 16) & 0xff,
                (m >> 8) & 0xff,
                (m & 0xff) / 0xff,
              ) // #ff000000
            : l === 4
            ? rgba(
                ((m >> 12) & 0xf) | ((m >> 8) & 0xf0),
                ((m >> 8) & 0xf) | ((m >> 4) & 0xf0),
                ((m >> 4) & 0xf) | (m & 0xf0),
                (((m & 0xf) << 4) | (m & 0xf)) / 0xff,
              ) // #f000
            : null) // invalid hex
        : (m = reRgbInteger.exec(format))
        ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format))
        ? new Rgb((m[1] * 255) / 100, (m[2] * 255) / 100, (m[3] * 255) / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format))
        ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format))
        ? rgba((m[1] * 255) / 100, (m[2] * 255) / 100, (m[3] * 255) / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format))
        ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format))
        ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format)
        ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
        : format === 'transparent'
        ? new Rgb(NaN, NaN, NaN, 0)
        : null;
    }

    function rgbn(n) {
      return new Rgb((n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb();
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function color_rgb(r, g, b, opacity) {
      return arguments.length === 1
        ? rgbConvert(r)
        : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    src_define(
      Rgb,
      color_rgb,
      extend(Color, {
        brighter: function (k) {
          k = k == null ? brighter : Math.pow(brighter, k);
          return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
        },
        darker: function (k) {
          k = k == null ? darker : Math.pow(darker, k);
          return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
        },
        rgb: function () {
          return this;
        },
        displayable: function () {
          return (
            -0.5 <= this.r &&
            this.r < 255.5 &&
            -0.5 <= this.g &&
            this.g < 255.5 &&
            -0.5 <= this.b &&
            this.b < 255.5 &&
            0 <= this.opacity &&
            this.opacity <= 1
          );
        },
        hex: rgb_formatHex, // Deprecated! Use color.formatHex.
        formatHex: rgb_formatHex,
        formatRgb: rgb_formatRgb,
        toString: rgb_formatRgb,
      }),
    );

    function rgb_formatHex() {
      return '#' + hex(this.r) + hex(this.g) + hex(this.b);
    }

    function rgb_formatRgb() {
      var a = this.opacity;
      a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (
        (a === 1 ? 'rgb(' : 'rgba(') +
        Math.max(0, Math.min(255, Math.round(this.r) || 0)) +
        ', ' +
        Math.max(0, Math.min(255, Math.round(this.g) || 0)) +
        ', ' +
        Math.max(0, Math.min(255, Math.round(this.b) || 0)) +
        (a === 1 ? ')' : ', ' + a + ')')
      );
    }

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? '0' : '') + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl();
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1
        ? hslConvert(h)
        : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    src_define(
      Hsl,
      hsl,
      extend(Color, {
        brighter: function (k) {
          k = k == null ? brighter : Math.pow(brighter, k);
          return new Hsl(this.h, this.s, this.l * k, this.opacity);
        },
        darker: function (k) {
          k = k == null ? darker : Math.pow(darker, k);
          return new Hsl(this.h, this.s, this.l * k, this.opacity);
        },
        rgb: function () {
          var h = (this.h % 360) + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
          return new Rgb(
            hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
            hsl2rgb(h, m1, m2),
            hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
            this.opacity,
          );
        },
        displayable: function () {
          return (
            ((0 <= this.s && this.s <= 1) || isNaN(this.s)) &&
            0 <= this.l &&
            this.l <= 1 &&
            0 <= this.opacity &&
            this.opacity <= 1
          );
        },
        formatHsl: function () {
          var a = this.opacity;
          a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
          return (
            (a === 1 ? 'hsl(' : 'hsla(') +
            (this.h || 0) +
            ', ' +
            (this.s || 0) * 100 +
            '%, ' +
            (this.l || 0) * 100 +
            '%' +
            (a === 1 ? ')' : ', ' + a + ')')
          );
        },
      }),
    );

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (
        (h < 60
          ? m1 + ((m2 - m1) * h) / 60
          : h < 180
          ? m2
          : h < 240
          ? m1 + ((m2 - m1) * (240 - h)) / 60
          : m1) * 255
      );
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/basis.js

    function basis(t1, v0, v1, v2, v3) {
      var t2 = t1 * t1,
        t3 = t2 * t1;
      return (
        ((1 - 3 * t1 + 3 * t2 - t3) * v0 +
          (4 - 6 * t2 + 3 * t3) * v1 +
          (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 +
          t3 * v3) /
        6
      );
    }

    /* harmony default export */ function src_basis(values) {
      var n = values.length - 1;
      return function (t) {
        var i =
            t <= 0 ? (t = 0) : t >= 1 ? ((t = 1), n - 1) : Math.floor(t * n),
          v1 = values[i],
          v2 = values[i + 1],
          v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
          v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
        return basis((t - i / n) * n, v0, v1, v2, v3);
      };
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/basisClosed.js

    /* harmony default export */ function basisClosed(values) {
      var n = values.length;
      return function (t) {
        var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
          v0 = values[(i + n - 1) % n],
          v1 = values[i % n],
          v2 = values[(i + 1) % n],
          v3 = values[(i + 2) % n];
        return basis((t - i / n) * n, v0, v1, v2, v3);
      };
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/constant.js

    /* harmony default export */ const d3_interpolate_src_constant = (
      x,
    ) => () => x; // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/color.js

    function linear(a, d) {
      return function (t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return (
        (a = Math.pow(a, y)),
        (b = Math.pow(b, y) - a),
        (y = 1 / y),
        function (t) {
          return Math.pow(a + t * b, y);
        }
      );
    }

    function hue(a, b) {
      var d = b - a;
      return d
        ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d)
        : constant(isNaN(a) ? b : a);
    }

    function gamma(y) {
      return (y = +y) === 1
        ? nogamma
        : function (a, b) {
            return b - a
              ? exponential(a, b, y)
              : d3_interpolate_src_constant(isNaN(a) ? b : a);
          };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear(a, d) : d3_interpolate_src_constant(isNaN(a) ? b : a);
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/rgb.js

    /* harmony default export */ const rgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb(start, end) {
        var r = color((start = color_rgb(start)).r, (end = color_rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
        return function (t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + '';
        };
      }

      rgb.gamma = rgbGamma;

      return rgb;
    })(1);

    function rgbSpline(spline) {
      return function (colors) {
        var n = colors.length,
          r = new Array(n),
          g = new Array(n),
          b = new Array(n),
          i,
          color;
        for (i = 0; i < n; ++i) {
          color = color_rgb(colors[i]);
          r[i] = color.r || 0;
          g[i] = color.g || 0;
          b[i] = color.b || 0;
        }
        r = spline(r);
        g = spline(g);
        b = spline(b);
        color.opacity = 1;
        return function (t) {
          color.r = r(t);
          color.g = g(t);
          color.b = b(t);
          return color + '';
        };
      };
    }

    var rgbBasis = rgbSpline(src_basis);
    var rgbBasisClosed = rgbSpline(basisClosed); // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/array.js

    /* harmony default export */ function src_array(a, b) {
      return (isNumberArray(b) ? numberArray : genericArray)(a, b);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
        na = a ? Math.min(nb, a.length) : 0,
        x = new Array(na),
        c = new Array(nb),
        i;

      for (i = 0; i < na; ++i) x[i] = value(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function (t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/date.js

    /* harmony default export */ function date(a, b) {
      var d = new Date();
      return (
        (a = +a),
        (b = +b),
        function (t) {
          return d.setTime(a * (1 - t) + b * t), d;
        }
      );
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/number.js

    /* harmony default export */ function src_number(a, b) {
      return (
        (a = +a),
        (b = +b),
        function (t) {
          return a * (1 - t) + b * t;
        }
      );
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/object.js

    /* harmony default export */ function object(a, b) {
      var i = {},
        c = {},
        k;

      if (a === null || typeof a !== 'object') a = {};
      if (b === null || typeof b !== 'object') b = {};

      for (k in b) {
        if (k in a) {
          i[k] = value(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function (t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/string.js

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, 'g');

    function zero(b) {
      return function () {
        return b;
      };
    }

    function one(b) {
      return function (t) {
        return b(t) + '';
      };
    }

    /* harmony default export */ function string(a, b) {
      var bi = (reA.lastIndex = reB.lastIndex = 0), // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

      // Coerce inputs to strings.
      (a = a + ''), (b = b + '');

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) {
          // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs;
          // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) {
          // numbers in a & b match
          if (s[i]) s[i] += bm;
          // coalesce with previous string
          else s[++i] = bm;
        } else {
          // interpolate non-matching numbers
          s[++i] = null;
          q.push({ i: i, x: src_number(am, bm) });
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs;
        // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2
        ? q[0]
          ? one(q[0].x)
          : zero(b)
        : ((b = q.length),
          function (t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join('');
          });
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/numberArray.js

    /* harmony default export */ function src_numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
        c = b.slice(),
        i;
      return function (t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function numberArray_isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/value.js

    /* harmony default export */ function value(a, b) {
      var t = typeof b,
        c;
      return b == null || t === 'boolean'
        ? d3_interpolate_src_constant(b)
        : (t === 'number'
            ? src_number
            : t === 'string'
            ? (c = color(b))
              ? ((b = c), rgb)
              : string
            : b instanceof color
            ? rgb
            : b instanceof Date
            ? date
            : numberArray_isNumberArray(b)
            ? src_numberArray
            : Array.isArray(b)
            ? genericArray
            : (typeof b.valueOf !== 'function' &&
                typeof b.toString !== 'function') ||
              isNaN(b)
            ? object
            : src_number)(a, b);
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/round.js

    /* harmony default export */ function round(a, b) {
      return (
        (a = +a),
        (b = +b),
        function (t) {
          return Math.round(a * (1 - t) + b * t);
        }
      );
    } // CONCATENATED MODULE: ../node_modules/d3-scale/src/constant.js

    function constants(x) {
      return function () {
        return x;
      };
    } // CONCATENATED MODULE: ../node_modules/d3-scale/src/number.js

    function number_number(x) {
      return +x;
    } // CONCATENATED MODULE: ../node_modules/d3-scale/src/continuous.js

    var unit = [0, 1];

    function continuous_identity(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= a = +a)
        ? function (x) {
            return (x - a) / b;
          }
        : constants(isNaN(b) ? NaN : 0.5);
    }

    function clamper(a, b) {
      var t;
      if (a > b) (t = a), (a = b), (b = t);
      return function (x) {
        return Math.max(a, Math.min(b, x));
      };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0],
        d1 = domain[1],
        r0 = range[0],
        r1 = range[1];
      if (d1 < d0) (d0 = normalize(d1, d0)), (r0 = interpolate(r1, r0));
      else (d0 = normalize(d0, d1)), (r0 = interpolate(r0, r1));
      return function (x) {
        return r0(d0(x));
      };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
        d = new Array(j),
        r = new Array(j),
        i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function (x) {
        var i = bisect(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
        .domain(source.domain())
        .range(source.range())
        .interpolate(source.interpolate())
        .clamp(source.clamp())
        .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
        range = unit,
        interpolate = value,
        transform,
        untransform,
        unknown,
        clamp = continuous_identity,
        piecewise,
        output,
        input;

      function rescale() {
        var n = Math.min(domain.length, range.length);
        if (clamp !== continuous_identity)
          clamp = clamper(domain[0], domain[n - 1]);
        piecewise = n > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return x == null || isNaN((x = +x))
          ? unknown
          : (
              output ||
              (output = piecewise(domain.map(transform), range, interpolate))
            )(transform(clamp(x)));
      }

      scale.invert = function (y) {
        return clamp(
          untransform(
            (
              input ||
              (input = piecewise(range, domain.map(transform), src_number))
            )(y),
          ),
        );
      };

      scale.domain = function (_) {
        return arguments.length
          ? ((domain = Array.from(_, number_number)), rescale())
          : domain.slice();
      };

      scale.range = function (_) {
        return arguments.length
          ? ((range = Array.from(_)), rescale())
          : range.slice();
      };

      scale.rangeRound = function (_) {
        return (range = Array.from(_)), (interpolate = round), rescale();
      };

      scale.clamp = function (_) {
        return arguments.length
          ? ((clamp = _ ? true : continuous_identity), rescale())
          : clamp !== continuous_identity;
      };

      scale.interpolate = function (_) {
        return arguments.length ? ((interpolate = _), rescale()) : interpolate;
      };

      scale.unknown = function (_) {
        return arguments.length ? ((unknown = _), scale) : unknown;
      };

      return function (t, u) {
        (transform = t), (untransform = u);
        return rescale();
      };
    }

    function continuous() {
      return transformer()(continuous_identity, continuous_identity);
    } // CONCATENATED MODULE: ../node_modules/d3-scale/src/init.js

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0:
          break;
        case 1:
          this.range(domain);
          break;
        default:
          this.range(range).domain(domain);
          break;
      }
      return this;
    }

    function initInterpolator(domain, interpolator) {
      switch (arguments.length) {
        case 0:
          break;
        case 1: {
          if (typeof domain === 'function') this.interpolator(domain);
          else this.range(domain);
          break;
        }
        default: {
          this.domain(domain);
          if (typeof interpolator === 'function')
            this.interpolator(interpolator);
          else this.range(interpolator);
          break;
        }
      }
      return this;
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/precisionPrefix.js

    /* harmony default export */ function precisionPrefix(step, value) {
      return Math.max(
        0,
        Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 -
          exponent(Math.abs(step)),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/precisionRound.js

    /* harmony default export */ function precisionRound(step, max) {
      (step = Math.abs(step)), (max = Math.abs(max) - step);
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    } // CONCATENATED MODULE: ../node_modules/d3-format/src/precisionFixed.js

    /* harmony default export */ function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    } // CONCATENATED MODULE: ../node_modules/d3-scale/src/tickFormat.js

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
        precision;
      specifier = formatSpecifier(specifier == null ? ',f' : specifier);
      switch (specifier.type) {
        case 's': {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (
            specifier.precision == null &&
            !isNaN((precision = precisionPrefix(step, value)))
          )
            specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case '':
        case 'e':
        case 'g':
        case 'p':
        case 'r': {
          if (
            specifier.precision == null &&
            !isNaN(
              (precision = precisionRound(
                step,
                Math.max(Math.abs(start), Math.abs(stop)),
              )),
            )
          )
            specifier.precision = precision - (specifier.type === 'e');
          break;
        }
        case 'f':
        case '%': {
          if (
            specifier.precision == null &&
            !isNaN((precision = precisionFixed(step)))
          )
            specifier.precision = precision - (specifier.type === '%') * 2;
          break;
        }
      }
      return format(specifier);
    } // CONCATENATED MODULE: ../node_modules/d3-scale/src/linear.js

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function (count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function (count, specifier) {
        var d = domain();
        return tickFormat(
          d[0],
          d[d.length - 1],
          count == null ? 10 : count,
          specifier,
        );
      };

      scale.nice = function (count) {
        if (count == null) count = 10;

        var d = domain();
        var i0 = 0;
        var i1 = d.length - 1;
        var start = d[i0];
        var stop = d[i1];
        var prestep;
        var step;
        var maxIter = 10;

        if (stop < start) {
          (step = start), (start = stop), (stop = step);
          (step = i0), (i0 = i1), (i1 = step);
        }

        while (maxIter-- > 0) {
          step = tickIncrement(start, stop, count);
          if (step === prestep) {
            d[i0] = start;
            d[i1] = stop;
            return domain(d);
          } else if (step > 0) {
            start = Math.floor(start / step) * step;
            stop = Math.ceil(stop / step) * step;
          } else if (step < 0) {
            start = Math.ceil(start * step) / step;
            stop = Math.floor(stop * step) / step;
          } else {
            break;
          }
          prestep = step;
        }

        return scale;
      };

      return scale;
    }

    function linear_linear() {
      var scale = continuous();

      scale.copy = function () {
        return copy(scale, linear_linear());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    } // CONCATENATED MODULE: ../node_modules/d3-ease/src/cubic.js

    function cubicIn(t) {
      return t * t * t;
    }

    function cubicOut(t) {
      return --t * t * t + 1;
    }

    function cubicInOut(t) {
      return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
    } // CONCATENATED MODULE: ../node_modules/d3-dispatch/src/dispatch.js

    var noop = { value: () => {} };

    function dispatch_dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + '') || t in _ || /[\s.]/.test(t))
          throw new Error('illegal type: ' + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function dispatch_parseTypenames(typenames, types) {
      return typenames
        .trim()
        .split(/^|\s+/)
        .map(function (t) {
          var name = '',
            i = t.indexOf('.');
          if (i >= 0) (name = t.slice(i + 1)), (t = t.slice(0, i));
          if (t && !types.hasOwnProperty(t))
            throw new Error('unknown type: ' + t);
          return { type: t, name: name };
        });
    }

    Dispatch.prototype = dispatch_dispatch.prototype = {
      constructor: Dispatch,
      on: function (typename, callback) {
        var _ = this._,
          T = dispatch_parseTypenames(typename + '', _),
          t,
          i = -1,
          n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n)
            if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name)))
              return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== 'function')
          throw new Error('invalid callback: ' + callback);
        while (++i < n) {
          if ((t = (typename = T[i]).type))
            _[t] = set(_[t], typename.name, callback);
          else if (callback == null)
            for (t in _) _[t] = set(_[t], typename.name, null);
        }

        return this;
      },
      copy: function () {
        var copy = {},
          _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function (type, that) {
        if ((n = arguments.length - 2) > 0)
          for (var args = new Array(n), i = 0, n, t; i < n; ++i)
            args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type))
          throw new Error('unknown type: ' + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i)
          t[i].value.apply(that, args);
      },
      apply: function (type, that, args) {
        if (!this._.hasOwnProperty(type))
          throw new Error('unknown type: ' + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i)
          t[i].value.apply(that, args);
      },
    };

    function get(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          (type[i] = noop), (type = type.slice(0, i).concat(type.slice(i + 1)));
          break;
        }
      }
      if (callback != null) type.push({ name: name, value: callback });
      return type;
    }

    /* harmony default export */ const src_dispatch = dispatch_dispatch; // CONCATENATED MODULE: ../node_modules/d3-timer/src/timer.js

    var timer_frame = 0, // is an animation frame pending?
      timeout = 0, // is a timeout pending?
      interval = 0, // are any timers active?
      pokeDelay = 1000, // how frequently we check for clock skew
      taskHead,
      taskTail,
      clockLast = 0,
      clockNow = 0,
      clockSkew = 0,
      clock =
        typeof performance === 'object' && performance.now ? performance : Date,
      setFrame =
        typeof window === 'object' && window.requestAnimationFrame
          ? window.requestAnimationFrame.bind(window)
          : function (f) {
              setTimeout(f, 17);
            };

    function now() {
      return (
        clockNow || (setFrame(clearNow), (clockNow = clock.now() + clockSkew))
      );
    }

    function clearNow() {
      clockNow = 0;
    }

    function Timer() {
      this._call = this._time = this._next = null;
    }

    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function (callback, delay, time) {
        if (typeof callback !== 'function')
          throw new TypeError('callback is not a function');
        time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail) taskTail._next = this;
          else taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time;
        sleep();
      },
      stop: function () {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      },
    };

    function timer(callback, delay, time) {
      var t = new Timer();
      t.restart(callback, delay, time);
      return t;
    }

    function timerFlush() {
      now(); // Get the current time, if not already set.
      ++timer_frame; // Pretend we’ve set an alarm, if we haven’t already.
      var t = taskHead,
        e;
      while (t) {
        if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
        t = t._next;
      }
      --timer_frame;
    }

    function wake() {
      clockNow = (clockLast = clock.now()) + clockSkew;
      timer_frame = timeout = 0;
      try {
        timerFlush();
      } finally {
        timer_frame = 0;
        nap();
        clockNow = 0;
      }
    }

    function poke() {
      var now = clock.now(),
        delay = now - clockLast;
      if (delay > pokeDelay) (clockSkew -= delay), (clockLast = now);
    }

    function nap() {
      var t0,
        t1 = taskHead,
        t2,
        time = Infinity;
      while (t1) {
        if (t1._call) {
          if (time > t1._time) time = t1._time;
          (t0 = t1), (t1 = t1._next);
        } else {
          (t2 = t1._next), (t1._next = null);
          t1 = t0 ? (t0._next = t2) : (taskHead = t2);
        }
      }
      taskTail = t0;
      sleep(time);
    }

    function sleep(time) {
      if (timer_frame) return; // Soonest alarm already set, or will be.
      if (timeout) timeout = clearTimeout(timeout);
      var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
      if (delay > 24) {
        if (time < Infinity)
          timeout = setTimeout(wake, time - clock.now() - clockSkew);
        if (interval) interval = clearInterval(interval);
      } else {
        if (!interval)
          (clockLast = clock.now()), (interval = setInterval(poke, pokeDelay));
        (timer_frame = 1), setFrame(wake);
      }
    } // CONCATENATED MODULE: ../node_modules/d3-timer/src/timeout.js

    /* harmony default export */ function src_timeout(callback, delay, time) {
      var t = new Timer();
      delay = delay == null ? 0 : +delay;
      t.restart(
        (elapsed) => {
          t.stop();
          callback(elapsed + delay);
        },
        delay,
        time,
      );
      return t;
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/schedule.js

    var emptyOn = src_dispatch('start', 'end', 'cancel', 'interrupt');
    var emptyTween = [];

    var CREATED = 0;
    var SCHEDULED = 1;
    var STARTING = 2;
    var STARTED = 3;
    var RUNNING = 4;
    var ENDING = 5;
    var ENDED = 6;

    /* harmony default export */ function schedule(
      node,
      name,
      id,
      index,
      group,
      timing,
    ) {
      var schedules = node.__transition;
      if (!schedules) node.__transition = {};
      else if (id in schedules) return;
      create(node, id, {
        name: name,
        index: index, // For context during callback.
        group: group, // For context during callback.
        on: emptyOn,
        tween: emptyTween,
        time: timing.time,
        delay: timing.delay,
        duration: timing.duration,
        ease: timing.ease,
        timer: null,
        state: CREATED,
      });
    }

    function init(node, id) {
      var schedule = schedule_get(node, id);
      if (schedule.state > CREATED)
        throw new Error('too late; already scheduled');
      return schedule;
    }

    function schedule_set(node, id) {
      var schedule = schedule_get(node, id);
      if (schedule.state > STARTED)
        throw new Error('too late; already running');
      return schedule;
    }

    function schedule_get(node, id) {
      var schedule = node.__transition;
      if (!schedule || !(schedule = schedule[id]))
        throw new Error('transition not found');
      return schedule;
    }

    function create(node, id, self) {
      var schedules = node.__transition,
        tween;

      // Initialize the self timer when the transition is created.
      // Note the actual delay is not known until the first callback!
      schedules[id] = self;
      self.timer = timer(schedule, 0, self.time);

      function schedule(elapsed) {
        self.state = SCHEDULED;
        self.timer.restart(start, self.delay, self.time);

        // If the elapsed delay is less than our first sleep, start immediately.
        if (self.delay <= elapsed) start(elapsed - self.delay);
      }

      function start(elapsed) {
        var i, j, n, o;

        // If the state is not SCHEDULED, then we previously errored on start.
        if (self.state !== SCHEDULED) return stop();

        for (i in schedules) {
          o = schedules[i];
          if (o.name !== self.name) continue;

          // While this element already has a starting transition during this frame,
          // defer starting an interrupting transition until that transition has a
          // chance to tick (and possibly end); see d3/d3-transition#54!
          if (o.state === STARTED) return src_timeout(start);

          // Interrupt the active transition, if any.
          if (o.state === RUNNING) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call('interrupt', node, node.__data__, o.index, o.group);
            delete schedules[i];
          }

          // Cancel any pre-empted transitions.
          else if (+i < id) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call('cancel', node, node.__data__, o.index, o.group);
            delete schedules[i];
          }
        }

        // Defer the first tick to end of the current frame; see d3/d3#1576.
        // Note the transition may be canceled after start and before the first tick!
        // Note this must be scheduled before the start event; see d3/d3-transition#16!
        // Assuming this is successful, subsequent callbacks go straight to tick.
        src_timeout(function () {
          if (self.state === STARTED) {
            self.state = RUNNING;
            self.timer.restart(tick, self.delay, self.time);
            tick(elapsed);
          }
        });

        // Dispatch the start event.
        // Note this must be done before the tween are initialized.
        self.state = STARTING;
        self.on.call('start', node, node.__data__, self.index, self.group);
        if (self.state !== STARTING) return; // interrupted
        self.state = STARTED;

        // Initialize the tween, deleting null tween.
        tween = new Array((n = self.tween.length));
        for (i = 0, j = -1; i < n; ++i) {
          if (
            (o = self.tween[i].value.call(
              node,
              node.__data__,
              self.index,
              self.group,
            ))
          ) {
            tween[++j] = o;
          }
        }
        tween.length = j + 1;
      }

      function tick(elapsed) {
        var t =
            elapsed < self.duration
              ? self.ease.call(null, elapsed / self.duration)
              : (self.timer.restart(stop), (self.state = ENDING), 1),
          i = -1,
          n = tween.length;

        while (++i < n) {
          tween[i].call(node, t);
        }

        // Dispatch the end event.
        if (self.state === ENDING) {
          self.on.call('end', node, node.__data__, self.index, self.group);
          stop();
        }
      }

      function stop() {
        self.state = ENDED;
        self.timer.stop();
        delete schedules[id];
        for (var i in schedules) return; // eslint-disable-line no-unused-vars
        delete node.__transition;
      }
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/interrupt.js

    /* harmony default export */ function interrupt(node, name) {
      var schedules = node.__transition,
        schedule,
        active,
        empty = true,
        i;

      if (!schedules) return;

      name = name == null ? null : name + '';

      for (i in schedules) {
        if ((schedule = schedules[i]).name !== name) {
          empty = false;
          continue;
        }
        active = schedule.state > STARTING && schedule.state < ENDING;
        schedule.state = ENDED;
        schedule.timer.stop();
        schedule.on.call(
          active ? 'interrupt' : 'cancel',
          node,
          node.__data__,
          schedule.index,
          schedule.group,
        );
        delete schedules[i];
      }

      if (empty) delete node.__transition;
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/interrupt.js

    /* harmony default export */ function selection_interrupt(name) {
      return this.each(function () {
        interrupt(this, name);
      });
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/decompose.js

    var degrees = 180 / Math.PI;

    var decompose_identity = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1,
    };

    /* harmony default export */ function decompose(a, b, c, d, e, f) {
      var scaleX, scaleY, skewX;
      if ((scaleX = Math.sqrt(a * a + b * b))) (a /= scaleX), (b /= scaleX);
      if ((skewX = a * c + b * d)) (c -= a * skewX), (d -= b * skewX);
      if ((scaleY = Math.sqrt(c * c + d * d)))
        (c /= scaleY), (d /= scaleY), (skewX /= scaleY);
      if (a * d < b * c)
        (a = -a), (b = -b), (skewX = -skewX), (scaleX = -scaleX);
      return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * degrees,
        skewX: Math.atan(skewX) * degrees,
        scaleX: scaleX,
        scaleY: scaleY,
      };
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/parse.js

    var svgNode;

    /* eslint-disable no-undef */
    function parseCss(value) {
      const m = new (typeof DOMMatrix === 'function'
        ? DOMMatrix
        : WebKitCSSMatrix)(value + '');
      return m.isIdentity
        ? decompose_identity
        : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    function parseSvg(value) {
      if (value == null) return decompose_identity;
      if (!svgNode)
        svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svgNode.setAttribute('transform', value);
      if (!(value = svgNode.transform.baseVal.consolidate()))
        return decompose_identity;
      value = value.matrix;
      return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
    } // CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/index.js

    function interpolateTransform(parse, pxComma, pxParen, degParen) {
      function pop(s) {
        return s.length ? s.pop() + ' ' : '';
      }

      function translate(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push('translate(', null, pxComma, null, pxParen);
          q.push(
            { i: i - 4, x: src_number(xa, xb) },
            { i: i - 2, x: src_number(ya, yb) },
          );
        } else if (xb || yb) {
          s.push('translate(' + xb + pxComma + yb + pxParen);
        }
      }

      function rotate(a, b, s, q) {
        if (a !== b) {
          if (a - b > 180) b += 360;
          else if (b - a > 180) a += 360; // shortest path
          q.push({
            i: s.push(pop(s) + 'rotate(', null, degParen) - 2,
            x: src_number(a, b),
          });
        } else if (b) {
          s.push(pop(s) + 'rotate(' + b + degParen);
        }
      }

      function skewX(a, b, s, q) {
        if (a !== b) {
          q.push({
            i: s.push(pop(s) + 'skewX(', null, degParen) - 2,
            x: src_number(a, b),
          });
        } else if (b) {
          s.push(pop(s) + 'skewX(' + b + degParen);
        }
      }

      function scale(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push(pop(s) + 'scale(', null, ',', null, ')');
          q.push(
            { i: i - 4, x: src_number(xa, xb) },
            { i: i - 2, x: src_number(ya, yb) },
          );
        } else if (xb !== 1 || yb !== 1) {
          s.push(pop(s) + 'scale(' + xb + ',' + yb + ')');
        }
      }

      return function (a, b) {
        var s = [], // string constants and placeholders
          q = []; // number interpolators
        (a = parse(a)), (b = parse(b));
        translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
        rotate(a.rotate, b.rotate, s, q);
        skewX(a.skewX, b.skewX, s, q);
        scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
        a = b = null; // gc
        return function (t) {
          var i = -1,
            n = q.length,
            o;
          while (++i < n) s[(o = q[i]).i] = o.x(t);
          return s.join('');
        };
      };
    }

    var interpolateTransformCss = interpolateTransform(
      parseCss,
      'px, ',
      'px)',
      'deg)',
    );
    var interpolateTransformSvg = interpolateTransform(
      parseSvg,
      ', ',
      ')',
      ')',
    ); // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/tween.js

    function tweenRemove(id, name) {
      var tween0, tween1;
      return function () {
        var schedule = schedule_set(this, id),
          tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = tween0 = tween;
          for (var i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1 = tween1.slice();
              tween1.splice(i, 1);
              break;
            }
          }
        }

        schedule.tween = tween1;
      };
    }

    function tweenFunction(id, name, value) {
      var tween0, tween1;
      if (typeof value !== 'function') throw new Error();
      return function () {
        var schedule = schedule_set(this, id),
          tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = (tween0 = tween).slice();
          for (
            var t = { name: name, value: value }, i = 0, n = tween1.length;
            i < n;
            ++i
          ) {
            if (tween1[i].name === name) {
              tween1[i] = t;
              break;
            }
          }
          if (i === n) tween1.push(t);
        }

        schedule.tween = tween1;
      };
    }

    /* harmony default export */ function tween(name, value) {
      var id = this._id;

      name += '';

      if (arguments.length < 2) {
        var tween = schedule_get(this.node(), id).tween;
        for (var i = 0, n = tween.length, t; i < n; ++i) {
          if ((t = tween[i]).name === name) {
            return t.value;
          }
        }
        return null;
      }

      return this.each(
        (value == null ? tweenRemove : tweenFunction)(id, name, value),
      );
    }

    function tweenValue(transition, name, value) {
      var id = transition._id;

      transition.each(function () {
        var schedule = schedule_set(this, id);
        (schedule.value || (schedule.value = {}))[name] = value.apply(
          this,
          arguments,
        );
      });

      return function (node) {
        return schedule_get(node, id).value[name];
      };
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/interpolate.js

    /* harmony default export */ function interpolate(a, b) {
      var c;
      return (typeof b === 'number'
        ? src_number
        : b instanceof color
        ? rgb
        : (c = color(b))
        ? ((b = c), rgb)
        : string)(a, b);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/attr.js

    function attr_attrRemove(name) {
      return function () {
        this.removeAttribute(name);
      };
    }

    function attr_attrRemoveNS(fullname) {
      return function () {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attr_attrConstant(name, interpolate, value1) {
      var string00,
        string1 = value1 + '',
        interpolate0;
      return function () {
        var string0 = this.getAttribute(name);
        return string0 === string1
          ? null
          : string0 === string00
          ? interpolate0
          : (interpolate0 = interpolate((string00 = string0), value1));
      };
    }

    function attr_attrConstantNS(fullname, interpolate, value1) {
      var string00,
        string1 = value1 + '',
        interpolate0;
      return function () {
        var string0 = this.getAttributeNS(fullname.space, fullname.local);
        return string0 === string1
          ? null
          : string0 === string00
          ? interpolate0
          : (interpolate0 = interpolate((string00 = string0), value1));
      };
    }

    function attr_attrFunction(name, interpolate, value) {
      var string00, string10, interpolate0;
      return function () {
        var string0,
          value1 = value(this),
          string1;
        if (value1 == null) return void this.removeAttribute(name);
        string0 = this.getAttribute(name);
        string1 = value1 + '';
        return string0 === string1
          ? null
          : string0 === string00 && string1 === string10
          ? interpolate0
          : ((string10 = string1),
            (interpolate0 = interpolate((string00 = string0), value1)));
      };
    }

    function attr_attrFunctionNS(fullname, interpolate, value) {
      var string00, string10, interpolate0;
      return function () {
        var string0,
          value1 = value(this),
          string1;
        if (value1 == null)
          return void this.removeAttributeNS(fullname.space, fullname.local);
        string0 = this.getAttributeNS(fullname.space, fullname.local);
        string1 = value1 + '';
        return string0 === string1
          ? null
          : string0 === string00 && string1 === string10
          ? interpolate0
          : ((string10 = string1),
            (interpolate0 = interpolate((string00 = string0), value1)));
      };
    }

    /* harmony default export */ function transition_attr(name, value) {
      var fullname = namespace(name),
        i = fullname === 'transform' ? interpolateTransformSvg : interpolate;
      return this.attrTween(
        name,
        typeof value === 'function'
          ? (fullname.local ? attr_attrFunctionNS : attr_attrFunction)(
              fullname,
              i,
              tweenValue(this, 'attr.' + name, value),
            )
          : value == null
          ? (fullname.local ? attr_attrRemoveNS : attr_attrRemove)(fullname)
          : (fullname.local ? attr_attrConstantNS : attr_attrConstant)(
              fullname,
              i,
              value,
            ),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/attrTween.js

    function attrInterpolate(name, i) {
      return function (t) {
        this.setAttribute(name, i.call(this, t));
      };
    }

    function attrInterpolateNS(fullname, i) {
      return function (t) {
        this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
      };
    }

    function attrTweenNS(fullname, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function attrTween(name, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    /* harmony default export */ function transition_attrTween(name, value) {
      var key = 'attr.' + name;
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== 'function') throw new Error();
      var fullname = namespace(name);
      return this.tween(
        key,
        (fullname.local ? attrTweenNS : attrTween)(fullname, value),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/delay.js

    function delayFunction(id, value) {
      return function () {
        init(this, id).delay = +value.apply(this, arguments);
      };
    }

    function delayConstant(id, value) {
      return (
        (value = +value),
        function () {
          init(this, id).delay = value;
        }
      );
    }

    /* harmony default export */ function delay(value) {
      var id = this._id;

      return arguments.length
        ? this.each(
            (typeof value === 'function' ? delayFunction : delayConstant)(
              id,
              value,
            ),
          )
        : schedule_get(this.node(), id).delay;
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/duration.js

    function durationFunction(id, value) {
      return function () {
        schedule_set(this, id).duration = +value.apply(this, arguments);
      };
    }

    function durationConstant(id, value) {
      return (
        (value = +value),
        function () {
          schedule_set(this, id).duration = value;
        }
      );
    }

    /* harmony default export */ function duration(value) {
      var id = this._id;

      return arguments.length
        ? this.each(
            (typeof value === 'function' ? durationFunction : durationConstant)(
              id,
              value,
            ),
          )
        : schedule_get(this.node(), id).duration;
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/ease.js

    function easeConstant(id, value) {
      if (typeof value !== 'function') throw new Error();
      return function () {
        schedule_set(this, id).ease = value;
      };
    }

    /* harmony default export */ function ease(value) {
      var id = this._id;

      return arguments.length
        ? this.each(easeConstant(id, value))
        : schedule_get(this.node(), id).ease;
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/easeVarying.js

    function easeVarying(id, value) {
      return function () {
        var v = value.apply(this, arguments);
        if (typeof v !== 'function') throw new Error();
        schedule_set(this, id).ease = v;
      };
    }

    /* harmony default export */ function transition_easeVarying(value) {
      if (typeof value !== 'function') throw new Error();
      return this.each(easeVarying(this._id, value));
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/filter.js

    /* harmony default export */ function transition_filter(match) {
      if (typeof match !== 'function') match = matcher(match);

      for (
        var groups = this._groups,
          m = groups.length,
          subgroups = new Array(m),
          j = 0;
        j < m;
        ++j
      ) {
        for (
          var group = groups[j],
            n = group.length,
            subgroup = (subgroups[j] = []),
            node,
            i = 0;
          i < n;
          ++i
        ) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Transition(subgroups, this._parents, this._name, this._id);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/merge.js

    /* harmony default export */ function transition_merge(transition) {
      if (transition._id !== this._id) throw new Error();

      for (
        var groups0 = this._groups,
          groups1 = transition._groups,
          m0 = groups0.length,
          m1 = groups1.length,
          m = Math.min(m0, m1),
          merges = new Array(m0),
          j = 0;
        j < m;
        ++j
      ) {
        for (
          var group0 = groups0[j],
            group1 = groups1[j],
            n = group0.length,
            merge = (merges[j] = new Array(n)),
            node,
            i = 0;
          i < n;
          ++i
        ) {
          if ((node = group0[i] || group1[i])) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Transition(merges, this._parents, this._name, this._id);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/on.js

    function start(name) {
      return (name + '')
        .trim()
        .split(/^|\s+/)
        .every(function (t) {
          var i = t.indexOf('.');
          if (i >= 0) t = t.slice(0, i);
          return !t || t === 'start';
        });
    }

    function onFunction(id, name, listener) {
      var on0,
        on1,
        sit = start(name) ? init : schedule_set;
      return function () {
        var schedule = sit(this, id),
          on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

        schedule.on = on1;
      };
    }

    /* harmony default export */ function transition_on(name, listener) {
      var id = this._id;

      return arguments.length < 2
        ? schedule_get(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/remove.js

    function removeFunction(id) {
      return function () {
        var parent = this.parentNode;
        for (var i in this.__transition) if (+i !== id) return;
        if (parent) parent.removeChild(this);
      };
    }

    /* harmony default export */ function transition_remove() {
      return this.on('end.remove', removeFunction(this._id));
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/select.js

    /* harmony default export */ function transition_select(select) {
      var name = this._name,
        id = this._id;

      if (typeof select !== 'function') select = selector(select);

      for (
        var groups = this._groups,
          m = groups.length,
          subgroups = new Array(m),
          j = 0;
        j < m;
        ++j
      ) {
        for (
          var group = groups[j],
            n = group.length,
            subgroup = (subgroups[j] = new Array(n)),
            node,
            subnode,
            i = 0;
          i < n;
          ++i
        ) {
          if (
            (node = group[i]) &&
            (subnode = select.call(node, node.__data__, i, group))
          ) {
            if ('__data__' in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
            schedule(
              subgroup[i],
              name,
              id,
              i,
              subgroup,
              schedule_get(node, id),
            );
          }
        }
      }

      return new Transition(subgroups, this._parents, name, id);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/selectAll.js

    /* harmony default export */ function transition_selectAll(select) {
      var name = this._name,
        id = this._id;

      if (typeof select !== 'function') select = selectorAll(select);

      for (
        var groups = this._groups,
          m = groups.length,
          subgroups = [],
          parents = [],
          j = 0;
        j < m;
        ++j
      ) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if ((node = group[i])) {
            for (
              var children = select.call(node, node.__data__, i, group),
                child,
                inherit = schedule_get(node, id),
                k = 0,
                l = children.length;
              k < l;
              ++k
            ) {
              if ((child = children[k])) {
                schedule(child, name, id, k, children, inherit);
              }
            }
            subgroups.push(children);
            parents.push(node);
          }
        }
      }

      return new Transition(subgroups, parents, name, id);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/selection.js

    var selection_Selection = src_selection.prototype.constructor;

    /* harmony default export */ function transition_selection() {
      return new selection_Selection(this._groups, this._parents);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/style.js

    function styleNull(name, interpolate) {
      var string00, string10, interpolate0;
      return function () {
        var string0 = styleValue(this, name),
          string1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1
          ? null
          : string0 === string00 && string1 === string10
          ? interpolate0
          : (interpolate0 = interpolate(
              (string00 = string0),
              (string10 = string1),
            ));
      };
    }

    function style_styleRemove(name) {
      return function () {
        this.style.removeProperty(name);
      };
    }

    function style_styleConstant(name, interpolate, value1) {
      var string00,
        string1 = value1 + '',
        interpolate0;
      return function () {
        var string0 = styleValue(this, name);
        return string0 === string1
          ? null
          : string0 === string00
          ? interpolate0
          : (interpolate0 = interpolate((string00 = string0), value1));
      };
    }

    function style_styleFunction(name, interpolate, value) {
      var string00, string10, interpolate0;
      return function () {
        var string0 = styleValue(this, name),
          value1 = value(this),
          string1 = value1 + '';
        if (value1 == null)
          string1 = value1 =
            (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1
          ? null
          : string0 === string00 && string1 === string10
          ? interpolate0
          : ((string10 = string1),
            (interpolate0 = interpolate((string00 = string0), value1)));
      };
    }

    function styleMaybeRemove(id, name) {
      var on0,
        on1,
        listener0,
        key = 'style.' + name,
        event = 'end.' + key,
        remove;
      return function () {
        var schedule = schedule_set(this, id),
          on = schedule.on,
          listener =
            schedule.value[key] == null
              ? remove || (remove = style_styleRemove(name))
              : undefined;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0 || listener0 !== listener)
          (on1 = (on0 = on).copy()).on(event, (listener0 = listener));

        schedule.on = on1;
      };
    }

    /* harmony default export */ function transition_style(
      name,
      value,
      priority,
    ) {
      var i =
        (name += '') === 'transform' ? interpolateTransformCss : interpolate;
      return value == null
        ? this.styleTween(name, styleNull(name, i)).on(
            'end.style.' + name,
            style_styleRemove(name),
          )
        : typeof value === 'function'
        ? this.styleTween(
            name,
            style_styleFunction(
              name,
              i,
              tweenValue(this, 'style.' + name, value),
            ),
          ).each(styleMaybeRemove(this._id, name))
        : this.styleTween(
            name,
            style_styleConstant(name, i, value),
            priority,
          ).on('end.style.' + name, null);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/styleTween.js

    function styleInterpolate(name, i, priority) {
      return function (t) {
        this.style.setProperty(name, i.call(this, t), priority);
      };
    }

    function styleTween(name, value, priority) {
      var t, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
        return t;
      }
      tween._value = value;
      return tween;
    }

    /* harmony default export */ function transition_styleTween(
      name,
      value,
      priority,
    ) {
      var key = 'style.' + (name += '');
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== 'function') throw new Error();
      return this.tween(
        key,
        styleTween(name, value, priority == null ? '' : priority),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/text.js

    function text_textConstant(value) {
      return function () {
        this.textContent = value;
      };
    }

    function text_textFunction(value) {
      return function () {
        var value1 = value(this);
        this.textContent = value1 == null ? '' : value1;
      };
    }

    /* harmony default export */ function transition_text(value) {
      return this.tween(
        'text',
        typeof value === 'function'
          ? text_textFunction(tweenValue(this, 'text', value))
          : text_textConstant(value == null ? '' : value + ''),
      );
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/textTween.js

    function textInterpolate(i) {
      return function (t) {
        this.textContent = i.call(this, t);
      };
    }

    function textTween(value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    /* harmony default export */ function transition_textTween(value) {
      var key = 'text';
      if (arguments.length < 1) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== 'function') throw new Error();
      return this.tween(key, textTween(value));
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/transition.js

    /* harmony default export */ function transition() {
      var name = this._name,
        id0 = this._id,
        id1 = newId();

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if ((node = group[i])) {
            var inherit = schedule_get(node, id0);
            schedule(node, name, id1, i, group, {
              time: inherit.time + inherit.delay + inherit.duration,
              delay: 0,
              duration: inherit.duration,
              ease: inherit.ease,
            });
          }
        }
      }

      return new Transition(groups, this._parents, name, id1);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/end.js

    /* harmony default export */ function end() {
      var on0,
        on1,
        that = this,
        id = that._id,
        size = that.size();
      return new Promise(function (resolve, reject) {
        var cancel = { value: reject },
          end = {
            value: function () {
              if (--size === 0) resolve();
            },
          };

        that.each(function () {
          var schedule = schedule_set(this, id),
            on = schedule.on;

          // If this node shared a dispatch with the previous node,
          // just assign the updated shared dispatch and we’re done!
          // Otherwise, copy-on-write.
          if (on !== on0) {
            on1 = (on0 = on).copy();
            on1._.cancel.push(cancel);
            on1._.interrupt.push(cancel);
            on1._.end.push(end);
          }

          schedule.on = on1;
        });

        // The selection was empty, resolve end immediately
        if (size === 0) resolve();
      });
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/index.js

    var id = 0;

    function Transition(groups, parents, name, id) {
      this._groups = groups;
      this._parents = parents;
      this._name = name;
      this._id = id;
    }

    function transition_transition(name) {
      return src_selection().transition(name);
    }

    function newId() {
      return ++id;
    }

    var selection_prototype = src_selection.prototype;

    Transition.prototype = transition_transition.prototype = {
      constructor: Transition,
      select: transition_select,
      selectAll: transition_selectAll,
      selectChild: selection_prototype.selectChild,
      selectChildren: selection_prototype.selectChildren,
      filter: transition_filter,
      merge: transition_merge,
      selection: transition_selection,
      transition: transition,
      call: selection_prototype.call,
      nodes: selection_prototype.nodes,
      node: selection_prototype.node,
      size: selection_prototype.size,
      empty: selection_prototype.empty,
      each: selection_prototype.each,
      on: transition_on,
      attr: transition_attr,
      attrTween: transition_attrTween,
      style: transition_style,
      styleTween: transition_styleTween,
      text: transition_text,
      textTween: transition_textTween,
      remove: transition_remove,
      tween: tween,
      delay: delay,
      duration: duration,
      ease: ease,
      easeVarying: transition_easeVarying,
      end: end,
      [Symbol.iterator]: selection_prototype[Symbol.iterator],
    }; // CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/transition.js

    var defaultTiming = {
      time: null, // Set on use.
      delay: 0,
      duration: 250,
      ease: cubicInOut,
    };

    function inherit(node, id) {
      var timing;
      while (!(timing = node.__transition) || !(timing = timing[id])) {
        if (!(node = node.parentNode)) {
          throw new Error(`transition ${id} not found`);
        }
      }
      return timing;
    }

    /* harmony default export */ function selection_transition(name) {
      var id, timing;

      if (name instanceof Transition) {
        (id = name._id), (name = name._name);
      } else {
        (id = newId()),
          ((timing = defaultTiming).time = now()),
          (name = name == null ? null : name + '');
      }

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if ((node = group[i])) {
            schedule(node, name, id, i, group, timing || inherit(node, id));
          }
        }
      }

      return new Transition(groups, this._parents, name, id);
    } // CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/index.js

    src_selection.prototype.interrupt = selection_interrupt;
    src_selection.prototype.transition = selection_transition; // CONCATENATED MODULE: ../node_modules/d3-transition/src/index.js // CONCATENATED MODULE: ./colorUtils.js

    function generateHash(name) {
      // Return a vector (0.0->1.0) that is a hash of the input string.
      // The hash is computed to favor early characters over later ones, so
      // that strings with similar starts have similar vectors. Only the first
      // 6 characters are considered.
      const MAX_CHAR = 6;

      let hash = 0;
      let maxHash = 0;
      let weight = 1;
      const mod = 10;

      if (name) {
        for (let i = 0; i < name.length; i++) {
          if (i > MAX_CHAR) {
            break;
          }
          hash += weight * (name.charCodeAt(i) % mod);
          maxHash += weight * (mod - 1);
          weight *= 0.7;
        }
        if (maxHash > 0) {
          hash = hash / maxHash;
        }
      }
      return hash;
    }

    function generateColorVector(name) {
      let vector = 0;
      if (name) {
        const nameArr = name.split('`');
        if (nameArr.length > 1) {
          name = nameArr[nameArr.length - 1]; // drop module name if present
        }
        name = name.split('(')[0]; // drop extra info
        vector = generateHash(name);
      }
      return vector;
    } // CONCATENATED MODULE: ./colorScheme.js

    function calculateColor(hue, vector) {
      let r;
      let g;
      let b;

      if (hue === 'red') {
        r = 200 + Math.round(55 * vector);
        g = 50 + Math.round(80 * vector);
        b = g;
      } else if (hue === 'orange') {
        r = 190 + Math.round(65 * vector);
        g = 90 + Math.round(65 * vector);
        b = 0;
      } else if (hue === 'yellow') {
        r = 175 + Math.round(55 * vector);
        g = r;
        b = 50 + Math.round(20 * vector);
      } else if (hue === 'green') {
        r = 50 + Math.round(60 * vector);
        g = 200 + Math.round(55 * vector);
        b = r;
      } else if (hue === 'pastelgreen') {
        // rgb(163,195,72) - rgb(238,244,221)
        r = 163 + Math.round(75 * vector);
        g = 195 + Math.round(49 * vector);
        b = 72 + Math.round(149 * vector);
      } else if (hue === 'blue') {
        // rgb(91,156,221) - rgb(217,232,247)
        r = 91 + Math.round(126 * vector);
        g = 156 + Math.round(76 * vector);
        b = 221 + Math.round(26 * vector);
      } else if (hue === 'aqua') {
        r = 50 + Math.round(60 * vector);
        g = 165 + Math.round(55 * vector);
        b = g;
      } else if (hue === 'cold') {
        r = 0 + Math.round(55 * (1 - vector));
        g = 0 + Math.round(230 * (1 - vector));
        b = 200 + Math.round(55 * vector);
      } else {
        // original warm palette
        r = 200 + Math.round(55 * vector);
        g = 0 + Math.round(230 * (1 - vector));
        b = 0 + Math.round(55 * (1 - vector));
      }

      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } // CONCATENATED MODULE: ./flamegraph.js

    /* harmony default export */ function flamegraph() {
      let w = 960; // graph width
      let h = null; // graph height
      let c = 18; // cell height
      let selection = null; // selection
      let tooltip = null; // tooltip
      let title = ''; // graph title
      let transitionDuration = 750;
      let transitionEase = cubicInOut; // tooltip offset
      let sort = false;
      let inverted = false; // invert the graph direction
      let clickHandler = null;
      let hoverHandler = null;
      let minFrameSize = 0;
      let detailsElement = null;
      let searchDetails = null;
      let selfValue = false;
      let resetHeightOnZoom = false;
      let scrollOnZoom = false;
      let minHeight = null;
      let computeDelta = false;
      let colorHue = null;

      let getName = function (d) {
        return d.data.n || d.data.name;
      };

      let getValue = function (d) {
        if ('v' in d) {
          return d.v;
        } else {
          return d.value;
        }
      };

      let getChildren = function (d) {
        return d.c || d.children;
      };

      let getLibtype = function (d) {
        return d.data.l || d.data.libtype;
      };

      let getDelta = function (d) {
        if ('d' in d.data) {
          return d.data.d;
        } else {
          return d.data.delta;
        }
      };

      let searchHandler = function (searchResults, searchSum, totalValue) {
        searchDetails = () => {
          if (detailsElement) {
            detailsElement.textContent =
              'search: ' +
              searchSum +
              ' of ' +
              totalValue +
              ' total time ( ' +
              format('.3f')(100 * (searchSum / totalValue), 3) +
              '%)';
          }
        };
        searchDetails();
      };
      const originalSearchHandler = searchHandler;

      let searchMatch = (d, term, ignoreCase = false) => {
        if (!term) {
          return false;
        }
        let label = getName(d);
        if (ignoreCase) {
          term = term.toLowerCase();
          label = label.toLowerCase();
        }
        const re = new RegExp(term);
        return typeof label !== 'undefined' && label && label.match(re);
      };
      const originalSearchMatch = searchMatch;

      let detailsHandler = function (d) {
        if (detailsElement) {
          if (d) {
            detailsElement.textContent = d;
          } else {
            if (typeof searchDetails === 'function') {
              searchDetails();
            } else {
              detailsElement.textContent = '';
            }
          }
        }
      };
      const originalDetailsHandler = detailsHandler;

      let labelHandler = function (d) {
        return (
          getName(d) +
          ' (' +
          format('.3f')(100 * (d.x1 - d.x0), 3) +
          '%, ' +
          getValue(d) +
          ' ms)'
        );
      };

      let colorMapper = function (d) {
        return d.highlight ? '#E600E6' : colorHash(getName(d), getLibtype(d));
      };
      const originalColorMapper = colorMapper;

      function colorHash(name, libtype) {
        // Return a color for the given name and library type. The library type
        // selects the hue, and the name is hashed to a color in that hue.

        // default when libtype is not in use
        let hue = colorHue || 'warm';

        if (!colorHue && !(typeof libtype === 'undefined' || libtype === '')) {
          // Select hue. Order is important.
          hue = 'red';
          if (typeof name !== 'undefined' && name && name.match(/::/)) {
            hue = 'yellow';
          }
          if (libtype === 'kernel') {
            hue = 'orange';
          } else if (libtype === 'jit') {
            hue = 'green';
          } else if (libtype === 'inlined') {
            hue = 'aqua';
          }
        }

        const vector = generateColorVector(name);
        return calculateColor(hue, vector);
      }

      function show(d) {
        d.data.fade = false;
        d.data.hide = false;
        if (d.children) {
          d.children.forEach(show);
        }
      }

      function hideSiblings(node) {
        let child = node;
        let parent = child.parent;
        let children, i, sibling;
        while (parent) {
          children = parent.children;
          i = children.length;
          while (i--) {
            sibling = children[i];
            if (sibling !== child) {
              sibling.data.hide = true;
            }
          }
          child = parent;
          parent = child.parent;
        }
      }

      function fadeAncestors(d) {
        if (d.parent) {
          d.parent.data.fade = true;
          fadeAncestors(d.parent);
        }
      }

      function zoom(d) {
        if (tooltip) tooltip.hide();
        hideSiblings(d);
        show(d);
        fadeAncestors(d);
        update();
        if (scrollOnZoom) {
          const chartOffset = src_select(this).select('svg')._groups[0][0]
            .parentNode.offsetTop;
          const maxFrames = (window.innerHeight - chartOffset) / c;
          const frameOffset = (d.height - maxFrames + 10) * c;
          window.scrollTo({
            top: chartOffset + frameOffset,
            left: 0,
            behavior: 'smooth',
          });
        }
        if (typeof clickHandler === 'function') {
          clickHandler(d);
        }
      }

      function searchTree(d, term) {
        const results = [];
        let sum = 0;

        function searchInner(d, foundParent) {
          let found = false;

          if (searchMatch(d, term)) {
            d.highlight = true;
            found = true;
            if (!foundParent) {
              sum += getValue(d);
            }
            results.push(d);
          } else {
            d.highlight = false;
          }

          if (getChildren(d)) {
            getChildren(d).forEach(function (child) {
              searchInner(child, foundParent || found);
            });
          }
        }
        searchInner(d, false);

        return [results, sum];
      }

      function findTree(d, id) {
        if (d.id === id) {
          return d;
        } else {
          const children = getChildren(d);
          if (children) {
            for (let i = 0; i < children.length; i++) {
              const found = findTree(children[i], id);
              if (found) {
                return found;
              }
            }
          }
        }
      }

      function clear(d) {
        d.highlight = false;
        if (getChildren(d)) {
          getChildren(d).forEach(function (child) {
            clear(child);
          });
        }
      }

      function doSort(a, b) {
        if (typeof sort === 'function') {
          return sort(a, b);
        } else if (sort) {
          return ascending_ascending(getName(a), getName(b));
        }
      }

      const p = partition();

      function filterNodes(root) {
        let nodeList = root.descendants();
        if (minFrameSize > 0) {
          const kx = w / (root.x1 - root.x0);
          nodeList = nodeList.filter(function (el) {
            return (el.x1 - el.x0) * kx > minFrameSize;
          });
        }
        return nodeList;
      }

      function update() {
        selection.each(function (root) {
          const x = linear_linear().range([0, w]);
          const y = linear_linear().range([0, c]);

          reappraiseNode(root);

          if (sort) root.sort(doSort);

          p(root);

          const kx = w / (root.x1 - root.x0);
          function width(d) {
            return (d.x1 - d.x0) * kx;
          }

          const descendants = filterNodes(root);
          const svg = src_select(this).select('svg');
          svg.attr('width', w);

          let g = svg.selectAll('g').data(descendants, function (d) {
            return d.id;
          });

          // if height is not set: set height on first update, after nodes were filtered by minFrameSize
          if (!h || resetHeightOnZoom) {
            const maxDepth = Math.max.apply(
              null,
              descendants.map(function (n) {
                return n.depth;
              }),
            );

            h = (maxDepth + 3) * c;
            if (h < minHeight) h = minHeight;

            svg.attr('height', h);
          }

          g.transition()
            .duration(transitionDuration)
            .ease(transitionEase)
            .attr('transform', function (d) {
              return (
                'translate(' +
                x(d.x0) +
                ',' +
                (inverted ? y(d.depth) : h - y(d.depth) - c) +
                ')'
              );
            });

          g.select('rect')
            .transition()
            .duration(transitionDuration)
            .ease(transitionEase)
            .attr('width', width);

          const node = g
            .enter()
            .append('svg:g')
            .attr('transform', function (d) {
              return (
                'translate(' +
                x(d.x0) +
                ',' +
                (inverted ? y(d.depth) : h - y(d.depth) - c) +
                ')'
              );
            });

          node
            .append('svg:rect')
            .transition()
            .delay(transitionDuration / 2)
            .attr('width', width);

          if (!tooltip) {
            node.append('svg:title');
          }

          node.append('foreignObject').append('xhtml:div');

          // Now we have to re-select to see the new elements (why?).
          g = svg.selectAll('g').data(descendants, function (d) {
            return d.id;
          });

          g.attr('width', width)
            .attr('height', function (d) {
              return c;
            })
            .attr('name', function (d) {
              return getName(d);
            })
            .attr('class', function (d) {
              return d.data.fade ? 'frame fade' : 'frame';
            });

          g.select('rect')
            .attr('height', function (d) {
              return c;
            })
            .attr('fill', function (d) {
              return colorMapper(d);
            });

          if (!tooltip) {
            g.select('title').text(labelHandler);
          }

          g.select('foreignObject')
            .attr('width', width)
            .attr('height', function (d) {
              return c;
            })
            .select('div')
            .attr('class', 'd3-flame-graph-label')
            .style('display', function (d) {
              return width(d) < 35 ? 'none' : 'block';
            })
            .transition()
            .delay(transitionDuration)
            .text(getName);

          g.on('click', (_, d) => {
            zoom(d);
          });

          g.exit().remove();

          g.on('mouseover', function (_, d) {
            if (tooltip) tooltip.show(d, this);
            detailsHandler(labelHandler(d));
            if (typeof hoverHandler === 'function') {
              hoverHandler(d);
            }
          }).on('mouseout', function () {
            if (tooltip) tooltip.hide();
            detailsHandler(null);
          });
        });
      }

      function merge(data, samples) {
        samples.forEach(function (sample) {
          const node = data.find(function (element) {
            return element.name === sample.name;
          });

          if (node) {
            node.value += sample.value;
            if (sample.children) {
              if (!node.children) {
                node.children = [];
              }
              merge(node.children, sample.children);
            }
          } else {
            data.push(sample);
          }
        });
      }

      function forEachNode(node, f) {
        f(node);
        let children = node.children;
        if (children) {
          const stack = [children];
          let count, child, grandChildren;
          while (stack.length) {
            children = stack.pop();
            count = children.length;
            while (count--) {
              child = children[count];
              f(child);
              grandChildren = child.children;
              if (grandChildren) {
                stack.push(grandChildren);
              }
            }
          }
        }
      }

      function adoptNode(node) {
        let id = 0;
        forEachNode(node, function (n) {
          n.id = id++;
        });
      }

      function reappraiseNode(root) {
        let node,
          children,
          grandChildren,
          childrenValue,
          i,
          j,
          child,
          childValue;
        const stack = [];
        const included = [];
        const excluded = [];
        const compoundValue = !selfValue;
        let item = root.data;
        if (item.hide) {
          root.value = 0;
          children = root.children;
          if (children) {
            excluded.push(children);
          }
        } else {
          root.value = item.fade ? 0 : getValue(item);
          stack.push(root);
        }
        // First DFS pass:
        // 1. Update node.value with node's self value
        // 2. Populate excluded list with children under hidden nodes
        // 3. Populate included list with children under visible nodes
        while ((node = stack.pop())) {
          children = node.children;
          if (children && (i = children.length)) {
            childrenValue = 0;
            while (i--) {
              child = children[i];
              item = child.data;
              if (item.hide) {
                child.value = 0;
                grandChildren = child.children;
                if (grandChildren) {
                  excluded.push(grandChildren);
                }
                continue;
              }
              if (item.fade) {
                child.value = 0;
              } else {
                childValue = getValue(item);
                child.value = childValue;
                childrenValue += childValue;
              }
              stack.push(child);
            }
            // Here second part of `&&` is actually checking for `node.data.fade`. However,
            // checking for node.value is faster and presents more oportunities for JS optimizer.
            if (compoundValue && node.value) {
              node.value -= childrenValue;
            }
            included.push(children);
          }
        }
        // Postorder traversal to compute compound value of each visible node.
        i = included.length;
        while (i--) {
          children = included[i];
          childrenValue = 0;
          j = children.length;
          while (j--) {
            childrenValue += children[j].value;
          }
          children[0].parent.value += childrenValue;
        }
        // Continue DFS to set value of all hidden nodes to 0.
        while (excluded.length) {
          children = excluded.pop();
          j = children.length;
          while (j--) {
            child = children[j];
            child.value = 0;
            grandChildren = child.children;
            if (grandChildren) {
              excluded.push(grandChildren);
            }
          }
        }
      }

      function processData() {
        selection.datum((data) => {
          if (data.constructor.name !== 'Node') {
            // creating a root hierarchical structure
            const root = hierarchy(data, getChildren);

            // augumenting nodes with ids
            adoptNode(root);

            // calculate actual value
            reappraiseNode(root);

            // store value for later use
            root.originalValue = root.value;

            // computing deltas for differentials
            if (computeDelta) {
              root.eachAfter((node) => {
                let sum = getDelta(node);
                const children = node.children;
                let i = children && children.length;
                while (--i >= 0) sum += children[i].delta;
                node.delta = sum;
              });
            }

            // setting the bound data for the selection
            return root;
          }
        });
      }

      function chart(s) {
        if (!arguments.length) {
          return chart;
        }

        // saving the selection on `.call`
        selection = s;

        // processing raw data to be used in the chart
        processData();

        // create chart svg
        selection.each(function (data) {
          if (src_select(this).select('svg').size() === 0) {
            const svg = src_select(this)
              .append('svg:svg')
              .attr('width', w)
              .attr('class', 'partition d3-flame-graph');

            if (h) {
              if (h < minHeight) h = minHeight;
              svg.attr('height', h);
            }

            svg
              .append('svg:text')
              .attr('class', 'title')
              .attr('text-anchor', 'middle')
              .attr('y', '25')
              .attr('x', w / 2)
              .attr('fill', '#808080')
              .text(title);

            if (tooltip) svg.call(tooltip);
          }
        });

        // first draw
        update();
      }

      chart.height = function (_) {
        if (!arguments.length) {
          return h;
        }
        h = _;
        return chart;
      };

      chart.minHeight = function (_) {
        if (!arguments.length) {
          return minHeight;
        }
        minHeight = _;
        return chart;
      };

      chart.width = function (_) {
        if (!arguments.length) {
          return w;
        }
        w = _;
        return chart;
      };

      chart.cellHeight = function (_) {
        if (!arguments.length) {
          return c;
        }
        c = _;
        return chart;
      };

      chart.tooltip = function (_) {
        if (!arguments.length) {
          return tooltip;
        }
        if (typeof _ === 'function') {
          tooltip = _;
        }
        return chart;
      };

      chart.title = function (_) {
        if (!arguments.length) {
          return title;
        }
        title = _;
        return chart;
      };

      chart.transitionDuration = function (_) {
        if (!arguments.length) {
          return transitionDuration;
        }
        transitionDuration = _;
        return chart;
      };

      chart.transitionEase = function (_) {
        if (!arguments.length) {
          return transitionEase;
        }
        transitionEase = _;
        return chart;
      };

      chart.sort = function (_) {
        if (!arguments.length) {
          return sort;
        }
        sort = _;
        return chart;
      };

      chart.inverted = function (_) {
        if (!arguments.length) {
          return inverted;
        }
        inverted = _;
        return chart;
      };

      chart.computeDelta = function (_) {
        if (!arguments.length) {
          return computeDelta;
        }
        computeDelta = _;
        return chart;
      };

      chart.setLabelHandler = function (_) {
        if (!arguments.length) {
          return labelHandler;
        }
        labelHandler = _;
        return chart;
      };
      // Kept for backwards compatibility.
      chart.label = chart.setLabelHandler;

      chart.search = function (term) {
        const searchResults = [];
        let searchSum = 0;
        let totalValue = 0;
        selection.each(function (data) {
          const res = searchTree(data, term);
          searchResults.push(...res[0]);
          searchSum += res[1];
          totalValue += data.originalValue;
        });
        searchHandler(searchResults, searchSum, totalValue);
        update();
      };

      chart.findById = function (id) {
        if (typeof id === 'undefined' || id === null) {
          return null;
        }
        let found = null;
        selection.each(function (data) {
          if (found === null) {
            found = findTree(data, id);
          }
        });
        return found;
      };

      chart.clear = function () {
        detailsHandler(null);
        selection.each(function (root) {
          clear(root);
          update();
        });
      };

      chart.zoomTo = function (d) {
        zoom(d);
      };

      chart.resetZoom = function () {
        selection.each(function (root) {
          zoom(root); // zoom to root
        });
      };

      chart.onClick = function (_) {
        if (!arguments.length) {
          return clickHandler;
        }
        clickHandler = _;
        return chart;
      };

      chart.onHover = function (_) {
        if (!arguments.length) {
          return hoverHandler;
        }
        hoverHandler = _;
        return chart;
      };

      chart.merge = function (data) {
        if (!selection) {
          return chart;
        }

        // TODO: Fix merge with zoom
        // Merging a zoomed chart doesn't work properly, so
        //  clearing zoom before merge.
        // To apply zoom on merge, we would need to set hide
        //  and fade on new data according to current data.
        // New ids are generated for the whole data structure,
        //  so previous ids might not be the same. For merge to
        //  work with zoom, previous ids should be maintained.
        this.resetZoom();

        // Clear search details
        // Merge requires a new search, updating data and
        //  the details handler with search results.
        // Since we don't store the search term, can't
        //  perform search again.
        searchDetails = null;
        detailsHandler(null);

        selection.datum((root) => {
          merge([root.data], [data]);
          return root.data;
        });
        processData();
        update();
        return chart;
      };

      chart.update = function (data) {
        if (!selection) {
          return chart;
        }
        if (data) {
          selection.datum(data);
          processData();
        }
        update();
        return chart;
      };

      chart.destroy = function () {
        if (!selection) {
          return chart;
        }
        if (tooltip) {
          tooltip.hide();
          if (typeof tooltip.destroy === 'function') {
            tooltip.destroy();
          }
        }
        selection.selectAll('svg').remove();
        return chart;
      };

      chart.setColorMapper = function (_) {
        if (!arguments.length) {
          colorMapper = originalColorMapper;
          return chart;
        }
        colorMapper = (d) => {
          const originalColor = originalColorMapper(d);
          return _(d, originalColor);
        };
        return chart;
      };
      // Kept for backwards compatibility.
      chart.color = chart.setColorMapper;

      chart.setColorHue = function (_) {
        if (!arguments.length) {
          colorHue = null;
          return chart;
        }
        colorHue = _;
        return chart;
      };

      chart.minFrameSize = function (_) {
        if (!arguments.length) {
          return minFrameSize;
        }
        minFrameSize = _;
        return chart;
      };

      chart.setDetailsElement = function (_) {
        if (!arguments.length) {
          return detailsElement;
        }
        detailsElement = _;
        return chart;
      };
      // Kept for backwards compatibility.
      chart.details = chart.setDetailsElement;

      chart.selfValue = function (_) {
        if (!arguments.length) {
          return selfValue;
        }
        selfValue = _;
        return chart;
      };

      chart.resetHeightOnZoom = function (_) {
        if (!arguments.length) {
          return resetHeightOnZoom;
        }
        resetHeightOnZoom = _;
        return chart;
      };

      chart.scrollOnZoom = function (_) {
        if (!arguments.length) {
          return scrollOnZoom;
        }
        scrollOnZoom = _;
        return chart;
      };

      chart.getName = function (_) {
        if (!arguments.length) {
          return getName;
        }
        getName = _;
        return chart;
      };

      chart.getValue = function (_) {
        if (!arguments.length) {
          return getValue;
        }
        getValue = _;
        return chart;
      };

      chart.getChildren = function (_) {
        if (!arguments.length) {
          return getChildren;
        }
        getChildren = _;
        return chart;
      };

      chart.getLibtype = function (_) {
        if (!arguments.length) {
          return getLibtype;
        }
        getLibtype = _;
        return chart;
      };

      chart.getDelta = function (_) {
        if (!arguments.length) {
          return getDelta;
        }
        getDelta = _;
        return chart;
      };

      chart.setSearchHandler = function (_) {
        if (!arguments.length) {
          searchHandler = originalSearchHandler;
          return chart;
        }
        searchHandler = _;
        return chart;
      };

      chart.setDetailsHandler = function (_) {
        if (!arguments.length) {
          detailsHandler = originalDetailsHandler;
          return chart;
        }
        detailsHandler = _;
        return chart;
      };

      chart.setSearchMatch = function (_) {
        if (!arguments.length) {
          searchMatch = originalSearchMatch;
          return chart;
        }
        searchMatch = _;
        return chart;
      };

      return chart;
    }

    __webpack_exports__ = __webpack_exports__['default'];
    /******/ return __webpack_exports__;
    /******/
  })();
});
