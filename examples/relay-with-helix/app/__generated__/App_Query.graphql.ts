/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type App_QueryVariables = {};
export type App_QueryResponse = {
    readonly song: {
        readonly firstVerse: string | null;
        readonly " $fragmentRefs": FragmentRefs<"App_SecondLyric">;
    } | null;
    readonly alphabet: ReadonlyArray<{
        readonly char: string;
    }>;
};
export type App_Query = {
    readonly response: App_QueryResponse;
    readonly variables: App_QueryVariables;
};



/*
query App_Query {
  song {
    firstVerse
    ...App_SecondLyric @defer(label: "App_Query$defer$App_SecondLyric")
  }
  alphabet @stream(label: "App_Query$stream$alphabet", initial_count: 3) {
    char
  }
}

fragment App_SecondLyric on Song {
  secondVerse
}
*/

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstVerse",
  "storageKey": null
},
v1 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Alphabet",
    "kind": "LinkedField",
    "name": "alphabet",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "char",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "App_Query",
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
                "name": "App_SecondLyric"
              }
            ]
          }
        ],
        "storageKey": null
      },
      {
        "kind": "Stream",
        "selections": (v1/*: any*/)
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "App_Query",
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
            "label": "App_Query$defer$App_SecondLyric",
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
      },
      {
        "if": null,
        "kind": "Stream",
        "label": "App_Query$stream$alphabet",
        "metadata": null,
        "selections": (v1/*: any*/),
        "useCustomizedBatch": null
      }
    ]
  },
  "params": {
    "cacheID": "fbe54a6760065599c7fb0f865646acde",
    "id": null,
    "metadata": {},
    "name": "App_Query",
    "operationKind": "query",
    "text": "query App_Query {\n  song {\n    firstVerse\n    ...App_SecondLyric @defer(label: \"App_Query$defer$App_SecondLyric\")\n  }\n  alphabet @stream(label: \"App_Query$stream$alphabet\", initial_count: 3) {\n    char\n  }\n}\n\nfragment App_SecondLyric on Song {\n  secondVerse\n}\n"
  }
};
})();
(node as any).hash = '55c7f4232ddb123a5acc161dfb3cdf0f';
export default node;
