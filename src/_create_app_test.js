import {is, Map} from "immutable";
import createApp from "./create_app";

function getState(app) {
  return app.queryState(context => context.state);
}

describe("app", function () {
  it("should have an empty Map as initial state", function () {
    const app = createApp();
    const initialState = getState(app);
    expect(is(initialState, Map())).to.equal(true);
  });

  it("should use given state", function () {
    const app = createApp({
      initialState: {
        some: {
          nested: "values"
        }
      }
    });
    const state = getState(app);
    expect(state.getIn(["some", "nested"])).to.equal("values");
  });

  describe("queryState", function () {
    it("should apply queries to state", function () {
      const app = createApp({
        initialState: {
          some: {
            nested: "values"
          }
        }
      });
      const query = context => context.state.getIn(["some", "nested"]);
      expect(app.queryState(query)).to.equal("values");
    });

    it("should pass argument object to query", function () {
      const app = createApp();
      const query = (context, args) => args.name;
      expect(app.queryState(query, {name: "Fred"})).to.equal("Fred");
    });

    it("should pass immutable queryContext to query", function () {
      const app = createApp();
      app.queryState(function (context) {
        expect(Object.isFrozen(context)).to.equal(true);
      });
    });
  });
});
