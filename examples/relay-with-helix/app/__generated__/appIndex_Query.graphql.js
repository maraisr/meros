/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type appIndex_SecondLyric$ref = any;
export type appIndex_QueryVariables = {||};
export type appIndex_QueryResponse = {|
  +song: ?{|
    +firstVerse: ?string,
    +$fragmentRefs: appIndex_SecondLyric$ref,
  |}
|};
export type appIndex_Query = {|
  variables: appIndex_QueryVariables,
  response: appIndex_QueryResponse,
|};
*/


/*
query appIndex_Query {
  song {
    firstVerse
    ...appIndex_SecondLyric @defer(label: "appIndex_Query$defer$appIndex_SecondLyric")
  }
}

fragment appIndex_SecondLyric on Song {
  secondVerse
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstVerse",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "appIndex_Query",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Song",
        "kind": "LinkedField",
        "name": "song",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "kind": "Defer",
            "selections": [
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "appIndex_SecondLyric"
              }
            ]
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "appIndex_Query",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Song",
        "kind": "LinkedField",
        "name": "song",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "if": null,
            "kind": "Defer",
            "label": "appIndex_Query$defer$appIndex_SecondLyric",
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "secondVerse",
                "storageKey": null
              }
            ]
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "13b116b28b3d640f3ea7a6c13aa60ce0",
    "id": null,
    "metadata": {},
    "name": "appIndex_Query",
    "operationKind": "query",
    "text": "query appIndex_Query {\n  song {\n    firstVerse\n    ...appIndex_SecondLyric @defer(label: \"appIndex_Query$defer$appIndex_SecondLyric\")\n  }\n}\n\nfragment appIndex_SecondLyric on Song {\n  secondVerse\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '4b30da87d3e0b35f113c9eefbdd65ba6';

module.exports = node;
