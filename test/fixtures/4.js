/* jshint esnext:true */

import * as foo from './3';

var keys = [];
for (var key in foo) {
  keys.push(key);
}

export default keys;
