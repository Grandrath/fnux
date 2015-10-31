# fnux - Functional Flux

Fnux is a Flux framework that allows you to write your UI logic purely functional. This makes your code very easy to test and to reason about. It also helps you to coordinate complex asynchronous operations and gives you control over accessing the global state and triggering side effects.

Fnux runs in the browser as well as on the server. It manages all the UI state within a single [Immutable.js](http://facebook.github.io/immutable-js/) `Map` instance. The different parts of your application can interact with this state via small interfaces. Fnux does not depend on [ReactJS](http://facebook.github.io/react/) but is designed to work well with it.


## Installation

```sh
$ npm install fnux
```


## Usage example

```javascript
import createApp from "fnux";
import React from "react";
import ReactDOM from "react-dom";

// a component
const App = React.createClass({
  handleClick() {
    const {invokeIntent} = this.props.context;
    invokeIntent(incrementCounter);
  },

  render: function render() {
    const {queryState} = this.props.context;
    const count = queryState(Counter.getCount);

    return <button onClick={this.handleClick}>You clicked {count} times</button>;
  }
});


// an intent
function incrementCounter(context) {
  const {queryState, updateState} = context;
  const currentCount = queryState(Counter.getCount);
  updateState(Counter.setCount, {count: currentCount + 1});
}


// a store
const Counter = {
  // a query
  getCount(context) {
    // context.state is an immutable.js Map instance
    return context.state.getIn(["counter", "value"]);
  },

  // a transition
  setCount(context, args) {
    return context.state.setIn(["counter", "value"], args.count);
  }
};


// hooking it all together
const app = createApp({
  initialState: {
    counter: {
      value: 0
    }
  }
});

app.subscribe(function render(componentContext) {
  ReactDOM.render(<App context={componentContext} />, document.body);
});
app.triggerUpdate();
```


## API

Fnux distinguishes between *components*, *intents*, *services* and *stores* that in turn consist of *queries* and *transitions*. Components are React components while the other are pure functions that are applied to a *context* object and an additional data object. The context object provides functions for interactions between the different parts.

### Component

Components are plain React components that you can structure to your liking. You don't need any special glue code to connect your components to Fnux. All that Fnux provides is the *componentContext* containing the functions `queryState`, `valueLink` and `invokeIntent`. It is up to you to pass this object down your component tree. The easiest way to do so is using the [context mechanism](http://facebook.github.io/react/docs/context.html) that React provides. A reference to the componentContext object is passed to the callback function that you pass to `subscribe`.

**componentContext**

The componentContext enables components to read data from the state, trigger an intent or connect a form field to a value within the state.

```javascript
queryState(queryFn, args)
```
`queryState` applies `queryFn` to the queryContext (see below) and the given `args` object and returns `queryFn`'s return value.

```javascript
invokeIntent(intentFn, args)
```
`invokeIntent` applies `intentFn` to the intentContext (see below) and the given `args` object and returns `undefined`.

```javascript
valueLink(queryFn, transitionFn)
```
`valueLink` returns an object with `value` and `requestChange` properties that can be consumed by React's `<input />` components (see [Two-Way Binding Helpers](http://facebook.github.io/react/docs/two-way-binding-helpers.html) in the React docs for more details). This allows you to bind a form element to a value within the state without having to write a separate intent function to update the state.

### Intent

Intents are functions that collect data via services or queries and generate a new state via transitions. Services might be asynchronous (e.g. when they fetch data over the network) and intents coordinate their results.

Intents are similar to "action creators" in other Flux implementations. The difference is that they don't dispatch action objects but use query and transition functions to interact with the state.

**intentContext**

The intentContext enables intents to read data from the state, update the state or invoke services.

```javascript
queryState(queryFn, args)
```
`queryState` applies `queryFn` to the queryContext (see below) and the given `args` object and returns `queryFn`'s return value.

```javascript
updateState(transitionFn, args)
```
`updateState` applies `transitionFn` to the transitionContext (see below) and the given `args` object and returns `undefined`.

```javascript
invokeService(serviceFn, args)
```
`invokeService` applies `serviceFn` to the serviceContext (see below) and the given `args` object and returns the `serviceFn`'s return value.

### Service

Services are functions that interact with the "outside world" via the serviceContext. This includes triggering HTTP requests, access sensors such as `window.navigator.geolocation` but also any client state such as `window.location.href` or `window.innerWidth`.

**serviceContext**

The serviceContext is defined when creating the app object. If you want to allow your services access to the entire global environment then you can simply pass in `window`:
```javascript
import createApp from "fnux";
const app = createApp({
  serviceContext: window
});
```

Alternatively you can restrict the serviceContext to only contain the values and methods that your services need:
```javascript
import createApp from "fnux";
const app = createApp({
  serviceContext: {
    fetch: window.fetch.bind(window),
    location: window.location,
    viewport: {
      get innerWidth() { return window.innerWidth; },
      get innerHeight() { return window.innerHeight; }
    }
  }
});
```

### Store

Stores bundle functions that either retrieve a value from the state (queries) or return an updated version of the state (transitions). Queries and corresponding transitions should be kept together because it makes it easier to change the structure of the state object during development.

#### Query

Queries are functions that retrieve a certain value from the state ("getter").

**queryContext**

The queryContext provides access to the current state object via its `state` property. This state object is an [Immutable.js `Map`](http://facebook.github.io/immutable-js/docs/#/Map) instance.

#### Transition

Transitions are functions that return an updated version of the state ("setter").

**transitionContext**

The transitionContext provides access to the current state object via its `state` property. This state object is an [Immutable.js `Map`](http://facebook.github.io/immutable-js/docs/#/Map) instance. The updated state that is returned from the transition function becomes the new state of the app and triggers a re-render of the view.


## License

MIT License. See [LICENSE](LICENSE).
