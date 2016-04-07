import { assert } from 'chai'

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
export const createStoreMultiplexer = (storeMapping) => {
  assert.ok(storeMapping, 'storeMapping is required')
  assert(Array.isArray(storeMapping), 'storeMapping must be an array')
  assert(storeMapping.every(x => Array.isArray(x) && x.length === 2), 'storeMapping must be an array of [<name>, <store>] arrays')

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
