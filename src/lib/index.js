import { assert } from 'chai'

const IS_DEV = process.env.NODE_ENV !== 'production'

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
export const createStoreMultiplexer = storeMapping => {
  if(IS_DEV) assert.ok(storeMapping, 'storeMapping is required')
  if(IS_DEV) assert(Array.isArray(storeMapping), 'storeMapping must be an array')
  if(IS_DEV) assert(storeMapping.every(x => Array.isArray(x) && x.length === 2), 'storeMapping must be an array of [<name>, <store>] arrays')

  const storeMap = new Map(storeMapping)
  const mapReduceStores = operation => {
    let result = {}
    for(let [name, store] of storeMap.entries())
      result[name] = operation(store)
    return result
  }

  const storesLiteral = storeMapping.reduce((prev, [name, store]) => {
    prev[name] = store
    return prev
  }, {})

  const dispatch = action => mapReduceStores(store => store.dispatch(action))
  const getState = () => mapReduceStores(store => store.getState())
  const selectFirst = (...names) => {
    for(let name of names) {
      if(storeMap.has(name))
        return storeMap.get(name)
    }
    throw new Error(`None of the requested stores exist in storeMapping | configured => ${JSON.stringify(storeMapping.map(x => x[0]))} requested => ${JSON.stringify(names)}`)
  }
  const select = (...names) => names.filter(x => storeMap.has(x)).map(x => storeMap.get(x))
  return  { ...storesLiteral
          , dispatch
          , getState
          , selectFirst
          , select
          }
}


/**
 * Returns object implementing redux store interface whose getState method selects a sub tree of the overall state.
 * Useful for library components that embed state in a subnode of consumer apps redux state
 * @param  {Object}    store      A store to bisect
 * @param  {...String} selectKeys The selection path to use with getState
 * @return {Object}               A sub store implementing redux store interface
 */
export const bisectStore = (...selectKeys) => (store, defaultState) => {
  if(IS_DEV) assert.ok(store, 'store must exist')
  if(IS_DEV) assert.ok(store.dispatch, 'store must define dispatch')
  if(IS_DEV) assert.ok(store.getState, 'store must define getState')
  if(IS_DEV) assert(selectKeys.length > 0, 'must define one or more keys to select on')
  const selectState = createStateSelector(...selectKeys)
  return  { dispatch: action => store.dispatch(action)
          , subscribe: listener => store.subscribe(listener)
          , getState: () => selectState(store.getState(), defaultState)
          }
}


/** Creates a function that selects a sub state from a state tree by path. */
export const createStateSelector = (...selectKeys) => (state, defaultState) => {
  const hasDefault = typeof defaultState !== 'undefined'
  if(IS_DEV) assert(Array.isArray(selectKeys), 'selectKeys must be an array.')
  if(IS_DEV) assert(selectKeys.length > 0, 'must specify a selection path')
  if(IS_DEV) assert.ok(state, 'state is required')
  let result = state
  for(let selectKey of selectKeys) {
    result = result[selectKey]
    if(IS_DEV) assert.ok(hasDefault || result, `'${selectKey}' state must exist in redux state in key chain [${selectKeys.join(', ')}] (did you forget to import '${selectKeys[0]}' reducer from its library into your combined reducers?) ${JSON.stringify({ state })}`)
    if(!result)
      break
  }
  return result || defaultState
}

/**
 * Creates a function that accepts state and ID for components that require state normalization across multiple instances and returns a function that will select state for the component.
 * @param  {string[]|number[]} selectKeys 1 or more key arguments to select the root state to bisect on.
 * @return {Function}                     Function that takes an ID and reutrns a normalized state for that ID.
 */
export const createStateBisector = (...selectKeys) => {
  return id => createStateSelector(...selectKeys, id)
}
