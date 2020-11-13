/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type appIndex_SecondLyric$ref: FragmentReference;
declare export opaque type appIndex_SecondLyric$fragmentType: appIndex_SecondLyric$ref;
export type appIndex_SecondLyric = {|
  +secondVerse: ?string,
  +$refType: appIndex_SecondLyric$ref,
|};
export type appIndex_SecondLyric$data = appIndex_SecondLyric;
export type appIndex_SecondLyric$key = {
  +$data?: appIndex_SecondLyric$data,
  +$fragmentRefs: appIndex_SecondLyric$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "appIndex_SecondLyric",
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
// prettier-ignore
(node/*: any*/).hash = '4ca432614989deaa228bb47808cddd00';

module.exports = node;
