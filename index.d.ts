export as namespace ReduxMux;

export function createStoreMultiplexer(storeMapping: any[]): any;
export function bisectStore(...selectKeys): any;
export function createStateSelector(...selectKeys): any;
export function createStateBisector(...selectKeys): any;