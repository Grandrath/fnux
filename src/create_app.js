import {EventEmitter} from "events";
import {is, fromJS} from "immutable";

const {freeze} = Object;
const changeEvent = "change";

function toJS(value) {
  return value && isFunction(value.toJS)
    ? value.toJS()
    : value;
}

function isFunction(value) {
  return typeof value === "function";
}

export default function createApp(options = {}) {
  let state = fromJS(options.initialState || {});

  const eventEmitter = new EventEmitter();

  function subscribe(subscriber) {
    eventEmitter.addListener(changeEvent, subscriber);

    return function unsubscribe() {
      eventEmitter.removeListener(changeEvent, subscriber);
    };
  }

  function triggerUpdate() {
    eventEmitter.emit(changeEvent);
  }

  function queryState(query, args) {
    return toJS(query(queryContext, args));
  }

  function updateState(transition, args) {
    const nextState = transition({state}, args);

    if (!is(nextState, state)) {
      state = nextState;
      triggerUpdate();
    }
  }

  function invokeIntent(intent, args) {
    return intent(intentContext, args);
  }

  const queryContext = freeze({
    get state() {
      return state;
    }
  });

  const intentContext = freeze({
    queryState,
    updateState
  });

  return freeze({
    subscribe,
    triggerUpdate,
    invokeIntent
  });
}
