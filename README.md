es6-module-transpiler-amd-formatter
===================================

ES6 Module Transpiler Formatter to Output AMD `define()` Format

## Overview

ES6 Module Transpiler `es6-module-transpiler` is an experimental compiler that allows you to write your JavaScript using a subset of the current ES6 module syntax, and compile it into various formats. The `es6-module-transpiler-amd-formatter` is one of those output formats that is focus on enabling the use of ES6 modules thru [RequireJS][] today.

[RequireJS]: http://www.requirejs.org/
[es6-module-transpiler]: https://github.com/square/es6-module-transpiler

## Disclaimer

This output format compromises in few of the ES6 features in ES6 modules, including live bindings, sealed objects, etc. This compromise is Ok when you try to use them as AMD modules.

## Usage

### Build tools

Since this formatters is an plugin for [es6-module-transpiler], you can use it with any existing build tool that supports [es6-module-transpiler] as the underlaying engine to transpile the ES6 modules.

You just need to make sure that `es6-module-transpiler-amd-formatter` is accessible for those tools, and pass the proper `formatter` option thru the [es6-module-transpiler][] configuration.

### Executable

If you plan to use the `compile-module` CLI, the formatters can be used directly from the command line:

```
$ npm install es6-module-transpiler
$ npm install es6-module-transpiler-amd-formatter
$ ./node_modules/.bin/compile-modules convert -f es6-module-transpiler-amd-formatter path/to/**/*.js -o build/
```

__The `-f` option allow you to specify the path to the specific formatter, which is this case is an installed module called `es6-module-transpiler-amd-formatter`.__

### Library

You can also use the formatter with the transpiler as a library:

```javascript
var transpiler = require('es6-module-transpiler');
var AMDFormatter = require('es6-module-transpiler-amd-formatter');
var Container = transpiler.Container;
var FileResolver = transpiler.FileResolver;

var container = new Container({
  resolvers: [new FileResolver(['lib/'])],
  formatter: new AMDFormatter()
});

container.getModule('index');
container.write('out/mylib.js');
```

## Supported ES6 Module Syntax

Again, this syntax is in flux and is closely tracking the module work being done by TC39. This package relies on the syntax supported by [es6-module-transpiler], which relies on [esprima], you can have more information about the supported syntax here: https://github.com/square/es6-module-transpiler#supported-es6-module-syntax

[esprima]: https://github.com/ariya/esprima

## Compiled Output

First of all, the output format for `define()` might looks alien even for many developers, but considering that [es6-module-transpiler] relies on [Recast] to mutate the original ES6 code, it can output the corresponding [sourceMap], you should be able to debug the module code without having to understand the actual output format.

[sourceMap]: http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
[Recast]: https://github.com/benjamn/recast

### Default export

For a module without imports, and a single default exports:

```javascript
export default function (a, b) {
  return a + b;
}
```

will produce something like this:

```javascript
define("component/foo", ["exports"], function(__exports__) {
  "use strict";

  function __es6_export__(name, value) {
    __exports__[name] = value;
  }

  __es6_export__("default", function(a, b) {
    return a + b;
  });
});
```

### Imports and exports

A more complex example will look like this:

```javascript
import assert from "./assert";

export default function (a, b) {
  assert(a);
  assert(b);
  return a + b;
};
```

and the output will be:

```javascript
define("component/foo", ["./assert", "exports"], function(component$assert$$, __exports__) {
  "use strict";

  function __es6_export__(name, value) {
    __exports__[name] = value;
  }

  var assert = component$assert$$["default"];
  __es6_export__("assert", component$assert$$["assert"]);

  __es6_export__("default", function(a, b) {
    assert(a);
    assert(b);
    return a + b;
  });
});
```

Part of the goal, is try to preserve as much as possible the original code of the module within the factory function. Obviously, this is difficult when you have to export default functions and other declarations. The only modifications you will see in the body are the calls to the `__es6_export__()` method to export the new value when defined or updated, the rest of the code will remain immutable.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Thanks, and enjoy living in the ES6 future!
