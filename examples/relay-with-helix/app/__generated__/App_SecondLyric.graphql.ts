/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type App_SecondLyric = {
    readonly secondVerse: string | null;
    readonly " $refType": "App_SecondLyric";
};
export type App_SecondLyric$data = App_SecondLyric;
export type App_SecondLyric$key = {
    readonly " $data"?: App_SecondLyric$data;
    readonly " $fragmentRefs": FragmentRefs<"App_SecondLyric">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "App_SecondLyric",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "secondVerse",
      "storageKey": null
    }
  ],
  "type": "Song",
  "abstractKey": null
};
(node as any).hash = 'cd85fa8c78b3b5441c591f2f74daea6d';
export default node;
