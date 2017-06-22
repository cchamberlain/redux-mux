'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStateBisector = exports.createStateSelector = exports.bisectStore = exports.createStoreMultiplexer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IS_DEV = process.env.NODE_ENV !== 'production';

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
  if (IS_DEV) (0, _invariant2.default)(storeMapping, 'storeMapping is required');
  if (IS_DEV) (0, _invariant2.default)(Array.isArray(storeMapping), 'storeMapping must be an array');
  if (IS_DEV) (0, _invariant2.default)(storeMapping.every(function (x) {
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
        var _step$value = _slicedToArray(_step.value, 2),
            name = _step$value[0],
            store = _step$value[1];

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
    var _ref2 = _slicedToArray(_ref, 2),
        name = _ref2[0],
        store = _ref2[1];

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

/**
 * Returns object implementing redux store interface whose getState method selects a sub tree of the overall state.
 * Useful for library components that embed state in a subnode of consumer apps redux state
 * @param  {Object}    store      A store to bisect
 * @param  {...String} selectKeys The selection path to use with getState
 * @return {Object}               A sub store implementing redux store interface
 */
var bisectStore = exports.bisectStore = function bisectStore() {
  for (var _len3 = arguments.length, selectKeys = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    selectKeys[_key3] = arguments[_key3];
  }

  return function (store, defaultState) {
    if (IS_DEV) (0, _invariant2.default)(store, 'store must exist');
    if (IS_DEV) (0, _invariant2.default)(store.dispatch, 'store must define dispatch');
    if (IS_DEV) (0, _invariant2.default)(store.getState, 'store must define getState');
    if (IS_DEV) (0, _invariant2.default)(selectKeys.length > 0, 'must define one or more keys to select on');
    var selectState = createStateSelector.apply(undefined, selectKeys);
    return { dispatch: function dispatch(action) {
        return store.dispatch(action);
      },
      subscribe: function subscribe(listener) {
        return store.subscribe(listener);
      },
      getState: function getState() {
        return selectState(store.getState(), defaultState);
      }
    };
  };
};

/** Creates a function that selects a sub state from a state tree by path. */
var createStateSelector = exports.createStateSelector = function createStateSelector() {
  for (var _len4 = arguments.length, selectKeys = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    selectKeys[_key4] = arguments[_key4];
  }

  return function (state, defaultState) {
    var hasDefault = typeof defaultState !== 'undefined';
    if (IS_DEV) (0, _invariant2.default)(Array.isArray(selectKeys), 'selectKeys must be an array.');
    if (IS_DEV) (0, _invariant2.default)(selectKeys.length > 0, 'must specify a selection path');
    if (IS_DEV) (0, _invariant2.default)(state, 'state is required');
    var result = state;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = selectKeys[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var selectKey = _step3.value;

        result = result[selectKey];
        if (IS_DEV) (0, _invariant2.default)(hasDefault || result, '\'' + selectKey + '\' state must exist in redux state in key chain [' + selectKeys.join(', ') + '] (did you forget to import \'' + selectKeys[0] + '\' reducer from its library into your combined reducers?) ' + JSON.stringify({ state: state }));
        if (!result) break;
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return result || defaultState;
  };
};

/**
 * Creates a function that accepts state and ID for components that require state normalization across multiple instances and returns a function that will select state for the component.
 * @param  {string[]|number[]} selectKeys 1 or more key arguments to select the root state to bisect on.
 * @return {Function}                     Function that takes an ID and reutrns a normalized state for that ID.
 */
var createStateBisector = exports.createStateBisector = function createStateBisector() {
  for (var _len5 = arguments.length, selectKeys = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    selectKeys[_key5] = arguments[_key5];
  }

  return function (id) {
    return createStateSelector.apply(undefined, selectKeys.concat([id]));
  };
};