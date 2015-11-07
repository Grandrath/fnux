import {spy} from "sinon";
import {is, Map} from "immutable";
import createApp from "./create_app.js";

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

function getTransitionContext(app) {
  let transitionContext;

  getIntentContext(app).updateState(function (context) {
    transitionContext = context;
    return context.state;
  });

  return transitionContext;
}

function getIntentContext(app) {
  return app.invokeIntent(context => context);
}

function getViewContext(app) {
  let viewContext;

  const unsubscribe = app.subscribe(function (context) {
    viewContext = context;
  });
  app.triggerUpdate();
  unsubscribe();

  return viewContext;
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

  it("should notify subscribers", function () {
    const app = createApp();
    const subscriber = spy();
    app.subscribe(subscriber);

    app.triggerUpdate();

    expect(subscriber).to.have.been.called;
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

        it("should apply a transition to the state", function () {
          const app = createApp();
          const intentContext = getIntentContext(app);

          intentContext.updateState(Person.setName, "Fred");

          expect(queryState(app, Person.getName)).to.equal("Fred");
        });

        it("should notify subscribers when state changes", function () {
          const app = createApp();
          const subscriber = spy();
          const intentContext = getIntentContext(app);
          app.subscribe(subscriber);

          intentContext.updateState(Person.setName, "Fred");

          expect(subscriber).to.have.been.called;
        });

        it("should not notify subscribers after unsubscribing", function () {
          const app = createApp();
          const subscriber = spy();
          const unsubscribe = app.subscribe(subscriber);
          const intentContext = getIntentContext(app);

          unsubscribe();
          intentContext.updateState(Person.setName, "Fred");

          expect(subscriber).not.to.have.been.called;
        });

        it("should notify subscribers *after* state changes", function () {
          const app = createApp();
          const intentContext = getIntentContext(app);
          app.subscribe(function () {
            expect(queryState(app, Person.getName)).to.equal("Fred");
          });

          intentContext.updateState(Person.setName, "Fred");
        });

        it("should not notify subscribers when state does not change", function () {
          const app = createApp({
            initialState: {name: "Fred"}
          });
          const intentContext = getIntentContext(app);
          const subscriber = spy();

          app.subscribe(subscriber);
          intentContext.updateState(Person.setName, "Fred");

          expect(subscriber).not.to.have.been.called;
        });

        it("should not modify the state when transition returns falsy value", function () {
          const app = createApp();
          const intentContext = getIntentContext(app);
          const subscriber = spy();
          app.subscribe(subscriber);

          const transition = () => undefined;
          intentContext.updateState(transition);

          expect(subscriber).not.to.have.been.called;
        });

        describe("transitionContext", function () {
          it("should be immutable", function () {
            const app = createApp();
            const transitionContext = getTransitionContext(app);

            expect(isFrozen(transitionContext)).to.equal(true);
          });
        });
      });

      describe("invokeService", function () {
        it("should call the service with the given serviceContext", function () {
          const serviceContext = {
            some: "function with side effects"
          };
          const app = createApp({
            serviceContext
          });
          const service = spy();
          const intentContext = getIntentContext(app);

          intentContext.invokeService(service);

          expect(service).to.have.been.calledWith(serviceContext);
        });

        it("should pass argument object to service", function () {
          const app = createApp();
          const service = (context, args) => args.name;
          const intentContext = getIntentContext(app);

          expect(intentContext.invokeService(service, {name: "Fred"})).to.equal("Fred");
        });
      });
    });
  });

  describe("viewContext", function () {
    it("should be immutable", function () {
      const app = createApp();
      const viewContext = getViewContext(app);

      expect(isFrozen(viewContext)).to.equal(true);
    });

    describe("queryState", function () {
      it("should query the state", function () {
        const app = createApp({
          initialState: {
            some: "value"
          }
        });
        const getValue = ({state}) => state.get("some");
        const viewContext = getViewContext(app);

        expect(viewContext.queryState(getValue)).to.equal("value");
      });
    });

    describe("invokeIntent", function () {
      it("should invoke the given intent", function () {
        const app = createApp({
          initialState: {
            a: "foo"
          }
        });

        const getA = makeQuery("a");
        const getB = makeQuery("b");
        const setB = makeTransition("b");
        const copyAtoB = ({queryState, updateState}) => updateState(setB, queryState(getA));

        const viewContext = getViewContext(app);
        viewContext.invokeIntent(copyAtoB);

        expect(queryState(app, getB)).to.equal("foo");
      });
    });

    describe("valueLink", function () {
      it("should return an object that fulfills React's valueLink API", function () {
        const app = createApp({
          initialState: {
            a: "foo"
          }
        });

        const getA = makeQuery("a");
        const setA = makeTransition("a");

        const viewContext = getViewContext(app);
        const valueLink = viewContext.valueLink(getA, setA);

        expect(valueLink.value, "initial value").to.equal("foo");

        valueLink.requestChange("bar");

        expect(queryState(app, getA), "value in state").to.equal("bar");
        expect(valueLink.value, "final value").to.equal("bar");
      });
    });
  });
});
