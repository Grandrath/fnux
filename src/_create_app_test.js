import {spy} from "sinon";
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

      describe("updateState", function () {
        const getValue = context => context.state.get("value");
        const setValue = (context, {value}) => context.state.set("value", value);
        const intent = (context, {value}) => context.updateState(setValue, {value});

        it("should apply a transition to the state", function () {
          const app = createApp();
          app.invokeIntent(intent, {value: "some value"});
          expect(app.queryState(getValue)).to.equal("some value");
        });

        it("should notify subscribers when state changes", function () {
          const app = createApp();
          const subscriber = spy();
          app.subscribe(subscriber);
          app.invokeIntent(intent, {value: "some value"});
          expect(subscriber).to.have.been.called;
        });

        it("should not notify subscribers when state does not change", function () {
          const app = createApp({
            initialState: {value: "some value"}
          });
          const subscriber = spy();
          app.subscribe(subscriber);
          app.invokeIntent(intent, {value: "some value"});
          expect(subscriber).not.to.have.been.called;
        });
      });
    });
  });
});
