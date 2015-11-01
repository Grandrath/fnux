import {fromJS} from "immutable";

export default function createApp(options = {}) {
  let state = fromJS(options.initialState || {});

  const {freeze} = Object;

  function queryState(query, args) {
    return query(queryContext, args);
  }

  const queryContext = freeze({
    get state() {
      return state;
    }
  });

  return {
    queryState
  };
}
