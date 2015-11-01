import {is, Map} from "immutable";
import createApp from "./create_app";

const {isFrozen} = Object;

function getState(app) {
  return getQueryContext(app).state;
}

function getQueryContext(app) {
  return app.queryState(context => context);
}

function getIntentContext(app) {
  return app.invokeIntent(context => context);
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

    describe("queryContext", function () {
      it("should be immutable", function () {
        const app = createApp();
        const queryContext = getQueryContext(app);
        expect(isFrozen(queryContext)).to.equal(true);
      });
    });
  });

  describe("invokeIntent", function () {
    it("should return the intent's return value", function () {
      const app = createApp();
      const intent = () => "some return value";
      expect(app.invokeIntent(intent)).to.equal("some return value");
    });

    it("should pass argument object to intent", function () {
      const app = createApp();
      const intent = (context, args) => args.name;
      expect(app.invokeIntent(intent, {name: "Fred"})).to.equal("Fred");
    });

    describe("intentContext", function () {
      it("should be immutable", function () {
        const app = createApp();
        const intentContext = getIntentContext(app);
        expect(isFrozen(intentContext)).to.equal(true);
      });

      describe("queryState", function () {
        it("should be app.queryState", function () {
          const app = createApp();
          const intentContext = getIntentContext(app);
          expect(intentContext.queryState).to.equal(app.queryState);
        });
      });
    });
  });
});
