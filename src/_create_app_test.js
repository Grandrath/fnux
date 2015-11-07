import {spy} from "sinon";
import {is, Map} from "immutable";
import createApp from "./create_app";

const {isFrozen} = Object;

function queryState(app, query, args) {
  return app.invokeIntent(({queryState}) => queryState(query, args));
}

function extractState(app) {
  return getQueryContext(app).state;
}

function getQueryContext(app) {
  return getIntentContext(app).queryState(context => context);
}

function getIntentContext(app) {
  return app.invokeIntent(context => context);
}

function makeTransition(key) {
  return (context, args) => context.state.set(key, args);
}

function makeQuery(key) {
  return context => context.state.get(key);
}

describe("app", function () {
  it("should be immutable", function () {
    const app = createApp();
    expect(isFrozen(app)).to.equal(true);
  });

  it("should have an empty immutableJS Map as initial state", function () {
    const app = createApp();
    const initialState = extractState(app);
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
    const state = extractState(app);

    expect(state.getIn(["some", "nested"])).to.equal("values");
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
        it("should apply queries to state", function () {
          const app = createApp({
            initialState: {
              some: {
                nested: "values"
              }
            }
          });
          const query = context => context.state.getIn(["some", "nested"]);
          const intentContext = getIntentContext(app);

          expect(intentContext.queryState(query)).to.equal("values");
        });

        it("should pass argument object to query", function () {
          const app = createApp();
          const query = (context, args) => args.name;
          const intentContext = getIntentContext(app);

          expect(intentContext.queryState(query, {name: "Fred"})).to.equal("Fred");
        });

        it("should convert immutableJS objects to plain JS", function () {
          const app = createApp({
            initialState: {
              someObject: {
                key: "value"
              }
            }
          });
          const query = context => context.state.get("someObject");

          expect(queryState(app, query)).to.deep.equal({key: "value"});
        });

        describe("queryContext", function () {
          it("should be immutable", function () {
            const app = createApp();
            const queryContext = getQueryContext(app);

            expect(isFrozen(queryContext)).to.equal(true);
          });
        });
      });

      describe("updateState", function () {
        const Person = {
          getName: makeQuery("name"),
          setName: makeTransition("name"),
          getAge: makeQuery("age"),
          setAge: makeTransition("age")
        };

        const setName = ({updateState}, {name}) => updateState(Person.setName, name);

        it("should apply a transition to the state", function () {
          const app = createApp();

          app.invokeIntent(setName, {name: "Fred"});

          expect(queryState(app, Person.getName)).to.equal("Fred");
        });

        it("should notify subscribers when state changes", function () {
          const app = createApp();
          const subscriber = spy();
          app.subscribe(subscriber);

          app.invokeIntent(setName, {name: "Fred"});

          expect(subscriber).to.have.been.called;
        });

        it("should notify subscribers *after* state changes", function () {
          const app = createApp();
          app.subscribe(function () {
            expect(queryState(app, Person.getName)).to.equal("Fred");
          });

          app.invokeIntent(setName, {name: "Fred"});
        });

        it("should not notify subscribers when state does not change", function () {
          const app = createApp({
            initialState: {name: "Fred"}
          });
          const subscriber = spy();
          app.subscribe(subscriber);

          app.invokeIntent(setName, {name: "Fred"});

          expect(subscriber).not.to.have.been.called;
        });
      });
    });
  });
});
