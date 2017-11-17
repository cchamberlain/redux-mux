import * as reduxMux from "../";

describe("createStoreMultiplexer", () => {
    test("returns an object", () => {
        const mux = reduxMux.createStoreMultiplexer([["foo", {}]])
        expect(typeof mux).toBe("object");
    })
});