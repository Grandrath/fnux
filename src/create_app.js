import {fromJS} from "immutable";

export default function createApp(options = {}) {
  let state = fromJS(options.initialState || {});

  function queryState(query, args) {
    return query({state}, args);
  }

  return {
    queryState
  };
}
