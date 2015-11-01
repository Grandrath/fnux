import {Map} from "immutable";

export default function createApp() {
  function queryState() {
    return Map();
  }

  return {
    queryState
  };
}
