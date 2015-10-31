# fnux - Functional Flux

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
