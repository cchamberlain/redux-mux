"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var invariant = require("invariant");
var IS_DEV = process.env.NODE_ENV !== "production";
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
function createStoreMultiplexer(storeMapping) {
    if (IS_DEV) {
        invariant(storeMapping, "storeMapping is required");
        invariant(Array.isArray(storeMapping), "storeMapping must be an array");
        invariant(storeMapping.every(function (x) { return Array.isArray(x) && x.length === 2; }), "storeMapping must be an array of [<name>, <store>] arrays");
    }
    var storeMap = new Map(storeMapping);
    var mapReduceStores = function (operation) {
        return Array.from(storeMap).reduce(function (_, _a) {
            var name = _a[0], store = _a[1];
            return tslib_1.__assign({}, _, (_b = {}, _b[name] = operation(store), _b));
            var _b;
        });
    };
    var storesLiteral = storeMapping.reduce(function (prev, _a) {
        var name = _a[0], store = _a[1];
        prev[name] = store;
        return prev;
    }, {});
    var dispatch = function (action) { return mapReduceStores(function (store) { return store.dispatch(action); }); };
    var getState = function () { return mapReduceStores(function (store) { return store.getState(); }); };
    var selectFirst = function () {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        for (var _a = 0, names_1 = names; _a < names_1.length; _a++) {
            var name_1 = names_1[_a];
            if (storeMap.has(name_1))
                return storeMap.get(name_1);
        }
        throw new Error("None of the requested stores exist in storeMapping | configured => " + JSON.stringify(storeMapping.map(function (x) { return x[0]; })) + " requested => " + JSON.stringify(names));
    };
    var select = function () {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        return names.filter(function (x) { return storeMap.has(x); }).map(function (x) { return storeMap.get(x); });
    };
    return tslib_1.__assign({}, storesLiteral, { dispatch: dispatch,
        getState: getState,
        selectFirst: selectFirst,
        select: select });
}
exports.createStoreMultiplexer = createStoreMultiplexer;
/**
 * Returns object implementing redux store interface whose getState method selects a sub tree of the overall state.
 * Useful for library components that embed state in a subnode of consumer apps redux state
 * @param  {Object}    store      A store to bisect
 * @param  {...String} selectKeys The selection path to use with getState
 * @return {Object}               A sub store implementing redux store interface
 */
function bisectStore() {
    var selectKeys = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        selectKeys[_i] = arguments[_i];
    }
    return function (store, defaultState) {
        if (IS_DEV) {
            invariant(store, "store must exist");
            invariant(store.dispatch, "store must define dispatch");
            invariant(store.getState, "store must define getState");
            invariant(selectKeys.length > 0, "must define one or more keys to select on");
        }
        var selectState = createStateSelector.apply(void 0, selectKeys);
        return {
            dispatch: function (action) { return store.dispatch(action); },
            subscribe: function (listener) { return store.subscribe(listener); },
            getState: function () { return selectState(store.getState(), defaultState); }
        };
    };
}
exports.bisectStore = bisectStore;
/** Creates a function that selects a sub state from a state tree by path. */
function createStateSelector() {
    var selectKeys = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        selectKeys[_i] = arguments[_i];
    }
    return function (state, defaultState) {
        var hasDefault = typeof defaultState !== "undefined";
        if (IS_DEV) {
            invariant(Array.isArray(selectKeys), "selectKeys must be an array.");
            invariant(selectKeys.length > 0, "must specify a selection path");
            invariant(state, "state is required");
        }
        var result = state;
        for (var _i = 0, selectKeys_1 = selectKeys; _i < selectKeys_1.length; _i++) {
            var selectKey = selectKeys_1[_i];
            result = result[selectKey];
            if (IS_DEV) {
                invariant(hasDefault || result, "'" + selectKey + "' state must exist in redux state in key chain [" + selectKeys.join(", ") + "] (did you forget to import '" + selectKeys[0] + "' reducer from its library into your combined reducers?) " + JSON.stringify({ state: state }));
            }
            if (!result)
                break;
        }
        return result || defaultState;
    };
}
exports.createStateSelector = createStateSelector;
/**
 * Creates a function that accepts state and ID for components that require state normalization across multiple instances and returns a function that will select state for the component.
 * @param  {string[]|number[]} selectKeys 1 or more key arguments to select the root state to bisect on.
 * @return {Function}                     Function that takes an ID and reutrns a normalized state for that ID.
 */
function createStateBisector() {
    var selectKeys = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        selectKeys[_i] = arguments[_i];
    }
    return function (id) { return createStateSelector.apply(void 0, selectKeys.concat([id])); };
}
exports.createStateBisector = createStateBisector;
