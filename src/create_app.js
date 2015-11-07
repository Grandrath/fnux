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

  const serviceContext = options.serviceContext;
  const eventEmitter = new EventEmitter();

  function subscribe(subscriber) {
    eventEmitter.addListener(changeEvent, subscriber);

    return function unsubscribe() {
      eventEmitter.removeListener(changeEvent, subscriber);
    };
  }

  function triggerUpdate() {
    eventEmitter.emit(changeEvent, viewContext);
  }

  function queryState(query, args) {
    return toJS(query(queryContext, args));
  }

  function updateState(transition, args) {
    const nextState = transition(transitionContext, args) || state;

    if (!is(nextState, state)) {
      state = nextState;
      triggerUpdate();
    }
  }

  function valueLink(query, transition) {
    return {
      get value() {
        return queryState(query);
      },

      requestChange(newValue) {
        updateState(transition, newValue);
      }
    };
  }

  function invokeIntent(intent, args) {
    return intent(intentContext, args);
  }

  function invokeService(service, args) {
    return service(serviceContext, args);
  }

  const queryContext = freeze({
    get state() {
      return state;
    }
  });

  const transitionContext = freeze({
    get state() {
      return state;
    }
  });

  const intentContext = freeze({
    queryState,
    updateState,
    invokeService
  });

  const viewContext = freeze({
    queryState,
    invokeIntent,
    valueLink
  });

  return freeze({
    subscribe,
    triggerUpdate,
    invokeIntent
  });
}
