import {EventEmitter} from "events";
import {is, fromJS} from "immutable";

const changeEvent = "change";

export default function createApp(options = {}) {
  let state = fromJS(options.initialState || {});

  const {freeze} = Object;
  const eventEmitter = new EventEmitter();

  function subscribe(subscriber) {
    eventEmitter.on(changeEvent, subscriber);
  }

  function queryState(query, args) {
    return query(queryContext, args);
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
