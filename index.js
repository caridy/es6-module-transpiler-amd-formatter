/* jshint node:true, undef:true, unused:true */

var assert = require('assert');

var recast = require('recast');
var types = recast.types;
var n = types.namedTypes;
var b = types.builders;
var Replacement = require('./lib/replacement');

/**
 * The 'define()' setting for referencing exports aims to produce code that can
 * be used in environments using AMD.
 *
 * @constructor
 */
function AMDFormatter() {}

/**
 * Returns an expression which globally references the export named by
 * `identifier` for the given module `mod`. For example:
 *
 *    // rsvp/defer.js, export default
 *    rsvp$defer$$.default
 *
 *    // rsvp/utils.js, export function isFunction
 *    rsvp$utils$$.isFunction
 *
 * @param {Module} mod
 * @param {ast-types.Identifier} identifier
 * @return {ast-types.MemberExpression}
 */
AMDFormatter.prototype.reference = function(mod, identifier) {
  return b.memberExpression(
    b.identifier(mod.id),
    n.Identifier.check(identifier) ? identifier : b.identifier(identifier),
    false
  );
};

/**
 * Process a variable declaration found at the top level of the module. Since
 * we do not need to rewrite exported variables, we can leave variable
 * declarations alone.
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} nodePath
 * @return {?Array.<ast-types.Node>}
 */
AMDFormatter.prototype.processVariableDeclaration = function(/* mod, nodePath */) {
  return null;
};

/**
 * Process a function declaration found at the top level of the module. Since
 * we do not need to rewrite exported functions, we can leave function
 * declarations alone.
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} nodePath
 * @returns {Array.<ast-types.Node>}
 */
AMDFormatter.prototype.processFunctionDeclaration = function(/* mod, nodePath */) {
  return null;
};

/**
 * Process a class declaration found at the top level of the module. Since
 * we do not need to rewrite exported classes, we can leave class
 * declarations alone.
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} nodePath
 * @returns {Array.<ast-types.Node>}
 */
AMDFormatter.prototype.processClassDeclaration = function(/* mod, nodePath */) {
  return null;
};

/**
 * Because exported references are captured via a closure as part of a getter
 * on the `exports` object, there's no need to rewrite local references to
 * exported values. For example, `value` in this example can stay as is:
 *
 *   // a.js
 *   export var value = 1;
 *
 * Would be rewritten to look something like this:
 *
 *   var value = 1;
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} referencePath
 * @return {ast-types.Expression}
 */
AMDFormatter.prototype.exportedReference = function(mod, referencePath) {
  return null;
};

/**
 * Gets a reference to an imported binding by getting the value from the
 * required module on demand. For example, this module:
 *
 *   // b.js
 *   import { value } from './a';
 *   console.log(value);
 *
 * Would be rewritten to look something like this:
 *
 *   var a$$ = require('./a');
 *   console.log(a$$.value):
 *
 * If the given reference does not refer to an imported binding then no
 * rewriting is required and `null` will be returned.
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} referencePath
 * @return {?ast-types.Expression}
 */
AMDFormatter.prototype.importedReference = function(mod, referencePath) {
  return null;
};

/**
 * We do not need to rewrite references to local declarations.
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} referencePath
 * @returns {?ast-types.Node}
 */
AMDFormatter.prototype.localReference = function(mod, referencePath) {
  return null;
};

/**
 * @param {Module} mod
 * @param {ast-types.Expression} declaration
 * @return {ast-types.Statement}
 */
AMDFormatter.prototype.defaultExport = function(mod, declaration) {
  if (n.FunctionDeclaration.check(declaration) ||
      n.ClassDeclaration.check(declaration)) {
    // export default function foo () {}
    // -> becomes:
    // function foo () {}
    // __es6_export__('default', foo);
    return [
      declaration,
      b.expressionStatement(
        b.callExpression(b.identifier('__es6_export__'), [b.literal("default"), declaration.id])
      )
    ];
  }
  // export default {foo: 1};
  return [b.expressionStatement(
    b.callExpression(b.identifier('__es6_export__'), [b.literal("default"), declaration])
  )];
};

/**
 * Replaces non-default exports. For declarations we simply remove the `export`
 * keyword. For export declarations that just specify bindings, e.g.
 *
 *   export { a, b };
 *
 * we remove them entirely since they'll be handled when we define properties on
 * the `exports` object.
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} nodePath
 * @return {?Replacement}
 */
AMDFormatter.prototype.processExportDeclaration = function(mod, nodePath) {
  var node = nodePath.node,
    declaration = node.declaration,
    specifiers = node.specifiers;

  if (n.FunctionDeclaration.check(declaration) ||
      n.ClassDeclaration.check(declaration)) {
    // export function <name> () {}
    // export class Foo {}
    return Replacement.swaps(nodePath, [declaration, b.expressionStatement(
      b.callExpression(b.identifier('__es6_export__'), [b.literal(declaration.id.name), declaration.id])
    )]);
  } else if (n.VariableDeclaration.check(declaration)) {
    // export default var foo = 1;
    return Replacement.swaps(nodePath, [declaration].concat(declaration.declarations.map(function (declaration) {
      return b.expressionStatement(
        b.callExpression(b.identifier('__es6_export__'), [b.literal(declaration.id.name), declaration.id])
      );
    })));
  } else if (declaration) {
    throw new Error('unexpected export style, found a declaration of type: ' + declaration.type);
  } else {
    return Replacement.swaps(nodePath, [].concat(specifiers.map(function (specifier) {
      return b.expressionStatement(
        b.callExpression(b.identifier('__es6_export__'), [b.literal((specifier.name || specifier.id).name), specifier.id])
      );
    })));
  }
};

/**
 * Since import declarations only control how we rewrite references we can just
 * remove them -- they don't turn into any actual statements.
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} nodePath
 * @return {?Replacement}
 */
AMDFormatter.prototype.processImportDeclaration = function(mod, nodePath) {
  return Replacement.removes(nodePath);
};

/**
 * Since named export reassignment is just a local variable, we can ignore it.
 * e.g.
 *
 * export var foo = 1;
 * foo = 2;
 *
 * @param {Module} mod
 * @param {ast-types.NodePath} nodePath
 * @return {?Replacement}
 */
AMDFormatter.prototype.processExportReassignment = function (mod, nodePath) {
  return null;
};

/**
 * Convert a list of ordered modules into a list of files.
 *
 * @param {Array.<Module>} modules Modules in execution order.
 * @return {Array.<ast-types.File}
 */
AMDFormatter.prototype.build = function(modules) {
  var self = this;
  return modules.map(function(mod) {
    var body = mod.ast.program.body,
      meta = self.buildDependenciesMeta(mod);

    // setting up all named imports, and re-exporting from as well
    body.unshift.apply(body, self.buildPrelude(mod));

    body.unshift(
      // module body runs in strict mode.
      b.expressionStatement(b.literal('use strict')),
      // function __es6_export__ (name, value) provides a way to set named exports into __exports__
      b.functionDeclaration(b.identifier('__es6_export__'), [b.identifier('name'), b.identifier('value')], b.blockStatement([
        b.expressionStatement(b.assignmentExpression("=",
          b.memberExpression(
            b.identifier('__exports__'),
            b.identifier('name'),
            true
          ),
          b.identifier('value')
        ))
      ]))
    );

    // wrapping the body of the program with a define() call
    mod.ast.program.body = [b.expressionStatement(b.callExpression(b.identifier('define'), [
        // module name argument
        b.literal(mod.name),
        // depedencies
        b.arrayExpression(meta.deps.concat(b.literal('exports'))),
        // factory function
        b.functionExpression(null, meta.identifiers.concat(b.identifier('__exports__')), b.blockStatement(body))
    ]))];

    mod.ast.filename = mod.relativePath;
    return mod.ast;
  });
};

/**
 * Build a series of identifiers based on the imports (and exports with sources)
 * in the given module.
 *
 * @private
 * @param {Module} mod
 * @return {
 *   setters: {ast-types.Array}
 *   deps: {ast-types.Array}
 * }
 */
AMDFormatter.prototype.buildDependenciesMeta = function(mod) {
  var requiredModules = [];
  var importedModules = [];
  var importedModuleIdentifiers = [];

  // `(import|export) { ... } from 'math'`
  [mod.imports, mod.exports].forEach(function(declarations) {
    declarations.modules.forEach(function(sourceModule) {
      if (~requiredModules.indexOf(sourceModule)) {
        return;
      }
      requiredModules.push(sourceModule);
      importedModuleIdentifiers.push(b.identifier(sourceModule.id));

      var matchingDeclaration;
      declarations.declarations.some(function(declaration) {
        if (declaration.source === sourceModule) {
          matchingDeclaration = declaration;
          return true;
        }
      });

      assert.ok(
        matchingDeclaration,
        'no matching declaration for source module: ' + sourceModule.relativePath
      );

      importedModules.push(b.literal(matchingDeclaration.sourcePath));
    });
  });

  return {
    identifiers: importedModuleIdentifiers, // [path$to$foo$$, path$to$bar$$]
    deps: importedModules                   // ["./foo", "./bar"]
  };
};

/**
 * Set the scoped values for every named import (and exports from)
 * in the given module.
 *
 * @private
 * @param {Module} mod
 * @return {Array[ast-types.Statement]}
 */
AMDFormatter.prototype.buildPrelude = function(mod) {
  var prelude = [];

  // import {foo} from "foo"; should hoist variables declaration
  mod.imports.names.forEach(function (name) {
    var specifier = mod.imports.findSpecifierByName(name),
      id = mod.getModule(specifier.declaration.node.source.value).id;

    if (!specifier) {
      return null;
    }

    prelude.push(b.variableDeclaration('var', [b.identifier(specifier.name)]));

    if (specifier.from) {
      // import { value } from './a';
      // import a from './a';
      prelude.push(b.expressionStatement(b.assignmentExpression("=",
        b.identifier(specifier.name),
        b.memberExpression(
          b.identifier(id),
          b.literal(specifier.from),
          true
        )
      )));
    } else {
      // import * as a from './a'
      prelude.push(b.expressionStatement(b.assignmentExpression("=",
        b.identifier(specifier.name),
        b.identifier(id)
      )));
    }
  });

  mod.exports.names.forEach(function(name) {
    var specifier = mod.exports.findSpecifierByName(name),
      id;

    assert.ok(
      specifier,
      'no export specifier found for export name `' +
      name + '` from ' + mod.relativePath
    );

    if (!specifier.declaration.node.source) {
      return;
    }
    id = mod.getModule(specifier.declaration.node.source.value).id;
    prelude.push(b.expressionStatement(
      b.callExpression(b.identifier('__es6_export__'), [
        b.literal(specifier.name),
        b.memberExpression(
          b.identifier(id),
          b.literal(specifier.from),
          true
        )
      ])
    ));
  });

  return prelude;
};

module.exports = AMDFormatter;
