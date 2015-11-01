import {is, Map} from "immutable";
import createApp from "./create_app";

describe("app", function () {
  it("should have an empty Map as initial state", function () {
    const app = createApp();
    const initialState = app.queryState(state => state);
    expect(is(initialState, Map())).to.equal(true);
  });
});
