'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStoreMultiplexer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _chai = require('chai');

/**
 * Takes in an ordered mapping of names to stores and reduces to a redux store compatible interface that can dispatch and getState to all stores or specific ones.
 * @example <caption>Creates a store multiplexer that can dispatch and getState on all stores at once.</caption>
 * let stores = createStoreMultiplexer([['app', appStore], ['fast', fastStore], ['session', sessionStore], ['local', localStore]])
 * stores.dispatch('SOME_ACTION')
 * let { app, fast, session, local } = stores.getState()
 * @example <caption>Each store can still be individually called with dispatched and getState</caption>
 * stores.app.dispatch('ACTION_FOR_APP_STORE_ONLY') 
 * let appState = stores.app.getState()
 * @param  {Array} storeMapping  The mapping of store names to store references.
 * @return {Object}              An object that can dispatch and getState to all stores or each individually with some useful helpers.
 */
var createStoreMultiplexer = exports.createStoreMultiplexer = function createStoreMultiplexer(storeMapping) {
  _chai.assert.ok(storeMapping, 'storeMapping is required');
  (0, _chai.assert)(Array.isArray(storeMapping), 'storeMapping must be an array');
  (0, _chai.assert)(storeMapping.every(function (x) {
    return Array.isArray(x) && x.length === 2;
  }), 'storeMapping must be an array of [<name>, <store>] arrays');

  var storeMap = new Map(storeMapping);
  var mapReduceStores = function mapReduceStores(operation) {
    var result = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = storeMap.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2);

        var name = _step$value[0];
        var store = _step$value[1];

        result[name] = operation(store);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  };

  var storesLiteral = storeMapping.reduce(function (prev, _ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var name = _ref2[0];
    var store = _ref2[1];

    prev[name] = store;
    return prev;
  }, {});

  var dispatch = function dispatch(action) {
    return mapReduceStores(function (store) {
      return store.dispatch(action);
    });
  };
  var getState = function getState() {
    return mapReduceStores(function (store) {
      return store.getState();
    });
  };
  var selectFirst = function selectFirst() {
    for (var _len = arguments.length, names = Array(_len), _key = 0; _key < _len; _key++) {
      names[_key] = arguments[_key];
    }

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = names[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var name = _step2.value;

        if (storeMap.has(name)) return storeMap.get(name);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    throw new Error('None of the requested stores exist in storeMapping | configured => ' + JSON.stringify(storeMapping.map(function (x) {
      return x[0];
    })) + ' requested => ' + JSON.stringify(names));
  };
  var select = function select() {
    for (var _len2 = arguments.length, names = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      names[_key2] = arguments[_key2];
    }

    return names.filter(function (x) {
      return storeMap.has(x);
    }).map(function (x) {
      return storeMap.get(x);
    });
  };
  return _extends({}, storesLiteral, { dispatch: dispatch,
    getState: getState,
    selectFirst: selectFirst,
    select: select
  });
};