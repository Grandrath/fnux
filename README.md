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

// a view
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

app.subscribe(function render(viewContext) {
  ReactDOM.render(<App context={viewContext} />, document.body);
});
app.triggerUpdate();
```

## License

MIT License. See [LICENSE](LICENSE).
