import {EventEmitter} from "events";
import {is, fromJS} from "immutable";

const {freeze} = Object;
const changeEvent = "change";

function toJS(value) {
  return value && typeof value.toJS === "function"
    ? value.toJS()
    : value;
}

export default function createApp(options = {}) {
  let state = fromJS(options.initialState || {});

  const eventEmitter = new EventEmitter();

  function subscribe(subscriber) {
    eventEmitter.on(changeEvent, subscriber);
  }

  function queryState(query, args) {
    return toJS(query(queryContext, args));
  }

  function updateState(transition, args) {
    const nextState = transition({state}, args);

    if (!is(nextState, state)) {
      state = nextState;
      eventEmitter.emit(changeEvent);
    }

    return {
      updateState
    };
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
    invokeIntent
  });
}
