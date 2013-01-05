/*!
 * GE UI Kit v0.5.2
 *
 * Copyright 2012 GE
 * Generated 2012-12-05
 * With thanks to Twitter Bootstrap, jQuery and various open source contributors
 */

/**
 * almond 0.2.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name) && !defining.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (defined.hasOwnProperty(depName) ||
                           waiting.hasOwnProperty(depName) ||
                           defining.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());
/*!
 * Lo-Dash v0.8.0 <http://lodash.com>
 * (c) 2012 John-David Dalton <http://allyoucanleet.com/>
 * Based on Underscore.js 1.4.0 <http://underscorejs.org>
 * (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
 * Available under MIT license <http://lodash.com/license>
 */
;(function(window, undefined) {
  'use strict';

  /** Detect free variable `exports` */
  var freeExports = typeof exports == 'object' && exports &&
    (typeof global == 'object' && global && global == global.global && (window = global), exports);

  /** Native prototype shortcuts */
  var ArrayProto = Array.prototype,
      BoolProto = Boolean.prototype,
      ObjectProto = Object.prototype,
      NumberProto = Number.prototype,
      StringProto = String.prototype;

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used by `cachedContains` as the default size when optimizations are enabled for large arrays */
  var largeArraySize = 30;

  /** Used to restore the original `_` reference in `noConflict` */
  var oldDash = window._;

  /** Used to detect delimiter values that should be processed by `tokenizeEvaluate` */
  var reComplexDelimiter = /[-?+=!~*%&^<>|{(\/]|\[\D|\b(?:delete|in|instanceof|new|typeof|void)\b/;

  /** Used to match HTML entities */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#x27);/g;

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to insert the data object variable into compiled template source */
  var reInsertVariable = /(?:__e|__t = )\(\s*(?![\d\s"']|this\.)/g;

  /** Used to detect if a method is native */
  var reNative = RegExp('^' +
    (ObjectProto.valueOf + '')
      .replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&')
      .replace(/valueOf|for [^\]]+/g, '.+?') + '$'
  );

  /** Used to ensure capturing order and avoid matches for undefined delimiters */
  var reNoMatch = /($^)/;

  /** Used to match HTML characters */
  var reUnescapedHtml = /[&<>"']/g;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to fix the JScript [[DontEnum]] bug */
  var shadowed = [
    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    'toLocaleString', 'toString', 'valueOf'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** Native method shortcuts */
  var concat = ArrayProto.concat,
      hasOwnProperty = ObjectProto.hasOwnProperty,
      push = ArrayProto.push,
      propertyIsEnumerable = ObjectProto.propertyIsEnumerable,
      slice = ArrayProto.slice,
      toString = ObjectProto.toString;

  /* Native method shortcuts for methods with the same name as other `lodash` methods */
  var nativeBind = reNative.test(nativeBind = slice.bind) && nativeBind,
      nativeFloor = Math.floor,
      nativeGetPrototypeOf = reNative.test(nativeGetPrototypeOf = Object.getPrototypeOf) && nativeGetPrototypeOf,
      nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,
      nativeIsFinite = window.isFinite,
      nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,
      nativeMax = Math.max,
      nativeMin = Math.min,
      nativeRandom = Math.random;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Timer shortcuts */
  var clearTimeout = window.clearTimeout,
      setTimeout = window.setTimeout;

  /**
   * Detect the JScript [[DontEnum]] bug:
   *
   * In IE < 9 an objects own properties, shadowing non-enumerable ones, are
   * made non-enumerable as well.
   */
  var hasDontEnumBug;

  /**
   * Detect if `Array#shift` and `Array#splice` augment array-like objects
   * incorrectly:
   *
   * Firefox < 10, IE compatibility mode, and IE < 9 have buggy Array `shift()`
   * and `splice()` functions that fail to remove the last element, `value[0]`,
   * of array-like objects even though the `length` property is set to `0`.
   * The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`
   * is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.
   */
  var hasObjectSpliceBug;

  /** Detect if own properties are iterated after inherited properties (IE < 9) */
  var iteratesOwnLast;

  /** Detect if an `arguments` object's indexes are non-enumerable (IE < 9) */
  var noArgsEnum = true;

  (function() {
    var object = { '0': 1, 'length': 1 },
        props = [];

    function ctor() { this.x = 1; }
    ctor.prototype = { 'valueOf': 1, 'y': 1 };
    for (var prop in new ctor) { props.push(prop); }
    for (prop in arguments) { noArgsEnum = !prop; }

    hasDontEnumBug = (props + '').length < 4;
    iteratesOwnLast = props[0] != 'x';
    hasObjectSpliceBug = (props.splice.call(object, 0, 1), object[0]);
  }(1));

  /** Detect if an `arguments` object's [[Class]] is unresolvable (Firefox < 4, IE < 9) */
  var noArgsClass = !isArguments(arguments);

  /** Detect if `Array#slice` cannot be used to convert strings to arrays (Opera < 10.52) */
  var noArraySliceOnStrings = slice.call('x')[0] != 'x';

  /**
   * Detect lack of support for accessing string characters by index:
   *
   * IE < 8 can't access characters by index and IE 8 can only access
   * characters by index on string literals.
   */
  var noCharByIndex = ('x'[0] + Object('x')[0]) != 'xx';

  /**
   * Detect if a node's [[Class]] is unresolvable (IE < 9)
   * and that the JS engine won't error when attempting to coerce an object to
   * a string without a `toString` property value of `typeof` "function".
   */
  try {
    var noNodeClass = ({ 'toString': 0 } + '', toString.call(window.document || 0) == objectClass);
  } catch(e) { }

  /* Detect if `Function#bind` exists and is inferred to be fast (all but V8) */
  var isBindFast = nativeBind && /\n|Opera/.test(nativeBind + toString.call(window.opera));

  /* Detect if `Object.keys` exists and is inferred to be fast (IE, Opera, V8) */
  var isKeysFast = nativeKeys && /^.+$|true/.test(nativeKeys + !!window.attachEvent);

  /* Detect if strict mode, "use strict", is inferred to be fast (V8) */
  var isStrictFast = !isBindFast;

  /**
   * Detect if sourceURL syntax is usable without erroring:
   *
   * The JS engine in Adobe products, like InDesign, will throw a syntax error
   * when it encounters a single line comment beginning with the `@` symbol.
   *
   * The JS engine in Narwhal will generate the function `function anonymous(){//}`
   * and throw a syntax error.
   *
   * Avoid comments beginning `@` symbols in IE because they are part of its
   * non-standard conditional compilation support.
   * http://msdn.microsoft.com/en-us/library/121hztk3(v=vs.94).aspx
   */
  try {
    var useSourceURL = (Function('//@')(), !window.attachEvent);
  } catch(e) { }

  /** Used to identify object classifications that are array-like */
  var arrayLikeClasses = {};
  arrayLikeClasses[boolClass] = arrayLikeClasses[dateClass] = arrayLikeClasses[funcClass] =
  arrayLikeClasses[numberClass] = arrayLikeClasses[objectClass] = arrayLikeClasses[regexpClass] = false;
  arrayLikeClasses[argsClass] = arrayLikeClasses[arrayClass] = arrayLikeClasses[stringClass] = true;

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[argsClass] = cloneableClasses[funcClass] = false;
  cloneableClasses[arrayClass] = cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] = cloneableClasses[regexpClass] =
  cloneableClasses[stringClass] = true;

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false,
    'unknown': true
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /*--------------------------------------------------------------------------*/

  /**
   * The `lodash` function.
   *
   * @name _
   * @constructor
   * @param {Mixed} value The value to wrap in a `lodash` instance.
   * @returns {Object} Returns a `lodash` instance.
   */
  function lodash(value) {
    // exit early if already wrapped
    if (value && value.__wrapped__) {
      return value;
    }
    // allow invoking `lodash` without the `new` operator
    if (!(this instanceof lodash)) {
      return new lodash(value);
    }
    this.__wrapped__ = value;
  }

  /**
   * By default, the template delimiters used by Lo-Dash are similar to those in
   * embedded Ruby (ERB). Change the following template settings to use alternative
   * delimiters.
   *
   * @static
   * @memberOf _
   * @type Object
   */
  lodash.templateSettings = {

    /**
     * Used to detect `data` property values to be HTML-escaped.
     *
     * @static
     * @memberOf _.templateSettings
     * @type RegExp
     */
    'escape': /<%-([\s\S]+?)%>/g,

    /**
     * Used to detect code to be evaluated.
     *
     * @static
     * @memberOf _.templateSettings
     * @type RegExp
     */
    'evaluate': /<%([\s\S]+?)%>/g,

    /**
     * Used to detect `data` property values to inject.
     *
     * @static
     * @memberOf _.templateSettings
     * @type RegExp
     */
    'interpolate': /<%=([\s\S]+?)%>/g,

    /**
     * Used to reference the data object in the template text.
     *
     * @static
     * @memberOf _.templateSettings
     * @type String
     */
    'variable': ''
  };

  /*--------------------------------------------------------------------------*/

  /**
   * The template used to create iterator functions.
   *
   * @private
   * @param {Obect} data The data object used to populate the text.
   * @returns {String} Returns the interpolated text.
   */
  var iteratorTemplate = template(
    // conditional strict mode
    '<% if (useStrict) { %>\'use strict\';\n<% } %>' +

    // the `iteratee` may be reassigned by the `top` snippet
    'var index, value, iteratee = <%= firstArg %>, ' +
    // assign the `result` variable an initial value
    'result<% if (init) { %> = <%= init %><% } %>;\n' +
    // add code before the iteration branches
    '<%= top %>;\n' +

    // the following branch is for iterating arrays and array-like objects
    '<% if (arrayBranch) { %>' +
    'var length = iteratee.length; index = -1;' +
    '  <% if (objectBranch) { %>\nif (length === +length) {<% } %>' +

    // add support for accessing string characters by index if needed
    '  <% if (noCharByIndex) { %>\n' +
    '  if (toString.call(iteratee) == stringClass) {\n' +
    '    iteratee = iteratee.split(\'\')\n' +
    '  }' +
    '  <% } %>\n' +

    '  <%= arrayBranch.beforeLoop %>;\n' +
    '  while (++index < length) {\n' +
    '    value = iteratee[index];\n' +
    '    <%= arrayBranch.inLoop %>\n' +
    '  }' +
    '  <% if (objectBranch) { %>\n}<% } %>' +
    '<% } %>' +

    // the following branch is for iterating an object's own/inherited properties
    '<% if (objectBranch) { %>' +
    '  <% if (arrayBranch) { %>\nelse {' +

    // add support for iterating over `arguments` objects if needed
    '  <%  } else if (noArgsEnum) { %>\n' +
    '  var length = iteratee.length; index = -1;\n' +
    '  if (length && isArguments(iteratee)) {\n' +
    '    while (++index < length) {\n' +
    '      value = iteratee[index += \'\'];\n' +
    '      <%= objectBranch.inLoop %>\n' +
    '    }\n' +
    '  } else {' +
    '  <% } %>' +

    // Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1
    // (if the prototype or a property on the prototype has been set)
    // incorrectly sets a function's `prototype` property [[Enumerable]]
    // value to `true`. Because of this Lo-Dash standardizes on skipping
    // the the `prototype` property of functions regardless of its
    // [[Enumerable]] value.
    '  <% if (!hasDontEnumBug) { %>\n' +
    '  var skipProto = typeof iteratee == \'function\' && \n' +
    '    propertyIsEnumerable.call(iteratee, \'prototype\');\n' +
    '  <% } %>' +

    // iterate own properties using `Object.keys` if it's fast
    '  <% if (isKeysFast && useHas) { %>\n' +
    '  var ownIndex = -1,\n' +
    '      ownProps = objectTypes[typeof iteratee] ? nativeKeys(iteratee) : [],\n' +
    '      length = ownProps.length;\n\n' +
    '  <%= objectBranch.beforeLoop %>;\n' +
    '  while (++ownIndex < length) {\n' +
    '    index = ownProps[ownIndex];\n' +
    '    <% if (!hasDontEnumBug) { %>if (!(skipProto && index == \'prototype\')) {\n  <% } %>' +
    '    value = iteratee[index];\n' +
    '    <%= objectBranch.inLoop %>\n' +
    '    <% if (!hasDontEnumBug) { %>}\n<% } %>' +
    '  }' +

    // else using a for-in loop
    '  <% } else { %>\n' +
    '  <%= objectBranch.beforeLoop %>;\n' +
    '  for (index in iteratee) {<%' +
    '    if (!hasDontEnumBug || useHas) { %>\n    if (<%' +
    '      if (!hasDontEnumBug) { %>!(skipProto && index == \'prototype\')<% }' +
    '      if (!hasDontEnumBug && useHas) { %> && <% }' +
    '      if (useHas) { %>hasOwnProperty.call(iteratee, index)<% }' +
    '    %>) {' +
    '    <% } %>\n' +
    '    value = iteratee[index];\n' +
    '    <%= objectBranch.inLoop %>;' +
    '    <% if (!hasDontEnumBug || useHas) { %>\n    }<% } %>\n' +
    '  }' +
    '  <% } %>' +

    // Because IE < 9 can't set the `[[Enumerable]]` attribute of an
    // existing property and the `constructor` property of a prototype
    // defaults to non-enumerable, Lo-Dash skips the `constructor`
    // property when it infers it's iterating over a `prototype` object.
    '  <% if (hasDontEnumBug) { %>\n\n' +
    '  var ctor = iteratee.constructor;\n' +
    '    <% for (var k = 0; k < 7; k++) { %>\n' +
    '  index = \'<%= shadowed[k] %>\';\n' +
    '  if (<%' +
    '      if (shadowed[k] == \'constructor\') {' +
    '        %>!(ctor && ctor.prototype === iteratee) && <%' +
    '      } %>hasOwnProperty.call(iteratee, index)) {\n' +
    '    value = iteratee[index];\n' +
    '    <%= objectBranch.inLoop %>\n' +
    '  }' +
    '    <% } %>' +
    '  <% } %>' +
    '  <% if (arrayBranch || noArgsEnum) { %>\n}<% } %>' +
    '<% } %>\n' +

    // add code to the bottom of the iteration function
    '<%= bottom %>;\n' +
    // finally, return the `result`
    'return result'
  );

  /**
   * Reusable iterator options shared by
   * `countBy`, `every`, `filter`, `find`, `forEach`, `forIn`, `forOwn`, `groupBy`,
   * `map`, `reject`, `some`, and `sortBy`.
   */
  var baseIteratorOptions = {
    'args': 'collection, callback, thisArg',
    'init': 'collection',
    'top': 'callback = createCallback(callback, thisArg)',
    'inLoop': 'if (callback(value, index, collection) === false) return result'
  };

  /** Reusable iterator options for `countBy`, `groupBy`, and `sortBy` */
  var countByIteratorOptions = {
    'init': '{}',
    'top': 'callback = createCallback(callback, thisArg)',
    'inLoop':
      'var prop = callback(value, index, collection);\n' +
      '(hasOwnProperty.call(result, prop) ? result[prop]++ : result[prop] = 1)'
  };

  /** Reusable iterator options for `every` and `some` */
  var everyIteratorOptions = {
    'init': 'true',
    'inLoop': 'if (!callback(value, index, collection)) return !result'
  };

  /** Reusable iterator options for `defaults` and `extend` */
  var extendIteratorOptions = {
    'useHas': false,
    'useStrict': false,
    'args': 'object',
    'init': 'object',
    'top':
      'for (var argsIndex = 1, argsLength = arguments.length; argsIndex < argsLength; argsIndex++) {\n' +
      '  if (iteratee = arguments[argsIndex]) {',
    'inLoop': 'result[index] = value',
    'bottom': '  }\n}'
  };

  /** Reusable iterator options for `filter`, `reject`, and `where` */
  var filterIteratorOptions = {
    'init': '[]',
    'inLoop': 'callback(value, index, collection) && result.push(value)'
  };

  /** Reusable iterator options for `find`, `forEach`, `forIn`, and `forOwn` */
  var forEachIteratorOptions = {
    'top': 'callback = createCallback(callback, thisArg)'
  };

  /** Reusable iterator options for `forIn` and `forOwn` */
  var forOwnIteratorOptions = {
    'inLoop': {
      'object': baseIteratorOptions.inLoop
    }
  };

  /** Reusable iterator options for `invoke`, `map`, `pluck`, and `sortBy` */
  var mapIteratorOptions = {
    'init': '',
    'beforeLoop': {
      'array':  'result = Array(length)',
      'object': 'result = ' + (isKeysFast ? 'Array(length)' : '[]')
    },
    'inLoop': {
      'array':  'result[index] = callback(value, index, collection)',
      'object': 'result' + (isKeysFast ? '[ownIndex] = ' : '.push') + '(callback(value, index, collection))'
    }
  };

  /** Reusable iterator options for `omit` and `pick` */
  var omitIteratorOptions = {
    'useHas': false,
    'args': 'object, callback, thisArg',
    'init': '{}',
    'top':
      'var isFunc = typeof callback == \'function\';\n' +
      'if (isFunc) callback = createCallback(callback, thisArg);\n' +
      'else var props = concat.apply(ArrayProto, arguments)',
    'inLoop':
      'if (isFunc\n' +
      '  ? !callback(value, index, object)\n' +
      '  : indexOf(props, index) < 0\n' +
      ') result[index] = value'
  };

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a function optimized for searching large arrays for a given `value`,
   * starting at `fromIndex`, using strict equality for comparisons, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {Mixed} value The value to search for.
   * @param {Number} [fromIndex=0] The index to start searching from.
   * @param {Number} [largeSize=30] The length at which an array is considered large.
   * @returns {Boolean} Returns `true` if `value` is found, else `false`.
   */
  function cachedContains(array, fromIndex, largeSize) {
    fromIndex || (fromIndex = 0);

    var length = array.length,
        isLarge = (length - fromIndex) >= (largeSize || largeArraySize),
        cache = isLarge ? {} : array;

    if (isLarge) {
      // init value cache
      var key,
          index = fromIndex - 1;

      while (++index < length) {
        // manually coerce `value` to string because `hasOwnProperty`, in some
        // older versions of Firefox, coerces objects incorrectly
        key = array[index] + '';
        (hasOwnProperty.call(cache, key) ? cache[key] : (cache[key] = [])).push(array[index]);
      }
    }
    return function(value) {
      if (isLarge) {
        var key = value + '';
        return hasOwnProperty.call(cache, key) && indexOf(cache[key], value) > -1;
      }
      return indexOf(cache, value, fromIndex) > -1;
    }
  }

  /**
   * Used by `sortBy` to compare transformed `collection` values, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {Number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ai = a.index,
        bi = b.index;

    a = a.criteria;
    b = b.criteria;

    // ensure a stable sort in V8 and other engines
    // http://code.google.com/p/v8/issues/detail?id=90
    if (a !== b) {
      if (a > b || a === undefined) {
        return 1;
      }
      if (a < b || b === undefined) {
        return -1;
      }
    }
    return ai < bi ? -1 : 1;
  }

  /**
   * Creates a function that, when called, invokes `func` with the `this`
   * binding of `thisArg` and prepends any `partailArgs` to the arguments passed
   * to the bound function.
   *
   * @private
   * @param {Function|String} func The function to bind or the method name.
   * @param {Mixed} [thisArg] The `this` binding of `func`.
   * @param {Array} partialArgs An array of arguments to be partially applied.
   * @returns {Function} Returns the new bound function.
   */
  function createBound(func, thisArg, partialArgs) {
    var isFunc = isFunction(func),
        isPartial = !partialArgs,
        methodName = func;

    // juggle arguments
    if (isPartial) {
      partialArgs = thisArg;
    }

    function bound() {
      // `Function#bind` spec
      // http://es5.github.com/#x15.3.4.5
      var args = arguments,
          thisBinding = isPartial ? this : thisArg;

      if (!isFunc) {
        func = thisArg[methodName];
      }
      if (partialArgs.length) {
        args = args.length
          ? partialArgs.concat(slice.call(args))
          : partialArgs;
      }
      if (this instanceof bound) {
        // get `func` instance if `bound` is invoked in a `new` expression
        noop.prototype = func.prototype;
        thisBinding = new noop;

        // mimic the constructor's `return` behavior
        // http://es5.github.com/#x13.2.2
        var result = func.apply(thisBinding, args);
        return result && objectTypes[typeof result]
          ? result
          : thisBinding
      }
      return func.apply(thisBinding, args);
    }
    return bound;
  }

  /**
   * Produces an iteration callback bound to an optional `thisArg`. If `func` is
   * a property name, the callback will return the property value for a given element.
   *
   * @private
   * @param {Function|String} [func=identity|property] The function called per
   * iteration or property name to query.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Function} Returns a callback function.
   */
  function createCallback(func, thisArg) {
    if (!func) {
      return identity;
    }
    if (typeof func != 'function') {
      return function(object) {
        return object[func];
      };
    }
    if (thisArg !== undefined) {
      return function(value, index, object) {
        return func.call(thisArg, value, index, object);
      };
    }
    return func;
  }

  /**
   * Creates compiled iteration functions. The iteration function will be created
   * to iterate over only objects if the first argument of `options.args` is
   * "object" or `options.inLoop.array` is falsey.
   *
   * @private
   * @param {Object} [options1, options2, ...] The compile options objects.
   *
   *  useHas - A boolean to specify whether or not to use `hasOwnProperty` checks
   *   in the object loop.
   *
   *  useStrict - A boolean to specify whether or not to include the ES5
   *   "use strict" directive.
   *
   *  args - A string of comma separated arguments the iteration function will
   *   accept.
   *
   *  init - A string to specify the initial value of the `result` variable.
   *
   *  top - A string of code to execute before the iteration branches.
   *
   *  beforeLoop - A string or object containing an "array" or "object" property
   *   of code to execute before the array or object loops.
   *
   *  inLoop - A string or object containing an "array" or "object" property
   *   of code to execute in the array or object loops.
   *
   *  bottom - A string of code to execute after the iteration branches but
   *   before the `result` is returned.
   *
   * @returns {Function} Returns the compiled function.
   */
  function createIterator() {
    var object,
        prop,
        value,
        index = -1,
        length = arguments.length;

    // merge options into a template data object
    var data = {
      'bottom': '',
      'top': '',
      'arrayBranch': { 'beforeLoop': '' },
      'objectBranch': { 'beforeLoop': '' }
    };

    while (++index < length) {
      object = arguments[index];
      for (prop in object) {
        value = (value = object[prop]) == null ? '' : value;
        // keep this regexp explicit for the build pre-process
        if (/beforeLoop|inLoop/.test(prop)) {
          if (typeof value == 'string') {
            value = { 'array': value, 'object': value };
          }
          data.arrayBranch[prop] = value.array || '';
          data.objectBranch[prop] = value.object || '';
        } else {
          data[prop] = value;
        }
      }
    }
    // set additional template `data` values
    var args = data.args,
        firstArg = /^[^,]+/.exec(args)[0],
        init = data.init,
        useStrict = data.useStrict;

    data.firstArg = firstArg;
    data.hasDontEnumBug = hasDontEnumBug;
    data.init = init == null ? firstArg : init;
    data.isKeysFast = isKeysFast;
    data.noArgsEnum = noArgsEnum;
    data.shadowed = shadowed;
    data.useHas = data.useHas !== false;
    data.useStrict = useStrict == null ? isStrictFast : useStrict;

    if (data.noCharByIndex == null) {
      data.noCharByIndex = noCharByIndex;
    }
    if (firstArg != 'collection' || !data.arrayBranch.inLoop) {
      data.arrayBranch = null;
    }
    // create the function factory
    var factory = Function(
        'arrayLikeClasses, ArrayProto, bind, compareAscending, concat, createCallback, ' +
        'forIn, hasOwnProperty, identity, indexOf, isArguments, isArray, isFunction, ' +
        'isPlainObject, objectClass, objectTypes, nativeKeys, propertyIsEnumerable, ' +
        'slice, stringClass, toString, undefined',
      'var callee = function(' + args + ') {\n' + iteratorTemplate(data) + '\n};\n' +
      'return callee'
    );
    // return the compiled function
    return factory(
      arrayLikeClasses, ArrayProto, bind, compareAscending, concat, createCallback,
      forIn, hasOwnProperty, identity, indexOf, isArguments, isArray, isFunction,
      isPlainObject, objectClass, objectTypes, nativeKeys, propertyIsEnumerable,
      slice, stringClass, toString
    );
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {String} match The matched character to escape.
   * @returns {String} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Used by `escape` to convert characters to HTML entities.
   *
   * @private
   * @param {String} match The matched character to escape.
   * @returns {String} Returns the escaped character.
   */
  function escapeHtmlChar(match) {
    return htmlEscapes[match];
  }

  /**
   * A no-operation function.
   *
   * @private
   */
  function noop() {
    // no operation performed
  }

  /**
   * Used by `unescape` to convert HTML entities to characters.
   *
   * @private
   * @param {String} match The matched character to unescape.
   * @returns {String} Returns the unescaped character.
   */
  function unescapeHtmlChar(match) {
    return htmlUnescapes[match];
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Creates an object composed of the inverted keys and values of the given `object`.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to invert.
   * @returns {Object} Returns the created inverted object.
   * @example
   *
   *  _.invert({ 'first': 'Moe', 'second': 'Larry', 'third': 'Curly' });
   * // => { 'Moe': 'first', 'Larry': 'second', 'Curly': 'third' } (order is not guaranteed)
   */
  var invert = createIterator({
    'args': 'object',
    'init': '{}',
    'inLoop': 'result[value] = index'
  });

  /**
   * Checks if `value` is an `arguments` object.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
   * @example
   *
   * (function() { return _.isArguments(arguments); })(1, 2, 3);
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  function isArguments(value) {
    return toString.call(value) == argsClass;
  }
  // fallback for browsers that can't detect `arguments` objects by [[Class]]
  if (noArgsClass) {
    isArguments = function(value) {
      return !!(value && hasOwnProperty.call(value, 'callee'));
    };
  }

  /**
   * Checks if `value` is an array.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is an array, else `false`.
   * @example
   *
   * (function() { return _.isArray(arguments); })();
   * // => false
   *
   * _.isArray([1, 2, 3]);
   * // => true
   */
  var isArray = nativeIsArray || function(value) {
    return toString.call(value) == arrayClass;
  };

  /**
   * Checks if `value` is a function.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   */
  function isFunction(value) {
    return typeof value == 'function';
  }
  // fallback for older versions of Chrome and Safari
  if (isFunction(/x/)) {
    isFunction = function(value) {
      return toString.call(value) == funcClass;
    };
  }

  /**
   * Checks if a given `value` is an object created by the `Object` constructor.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Stooge(name, age) {
   *   this.name = name;
   *   this.age = age;
   * }
   *
   * _.isPlainObject(new Stooge('moe', 40));
   * // false
   *
   * _.isPlainObject([1, 2, 3]);
   * // false
   *
   * _.isPlainObject({ 'name': 'moe', 'age': 40 });
   * // => true
   */
  var isPlainObject = !nativeGetPrototypeOf ? isPlainFallback : function(value) {
    if (!(value && typeof value == 'object')) {
      return false;
    }
    var valueOf = value.valueOf,
        objProto = typeof valueOf == 'function' && (objProto = nativeGetPrototypeOf(valueOf)) && nativeGetPrototypeOf(objProto);

    return objProto
      ? value == objProto || (nativeGetPrototypeOf(value) == objProto && !isArguments(value))
      : isPlainFallback(value);
  };

  /**
   * A fallback implementation of `isPlainObject` that checks if a given `value`
   * is an object created by the `Object` constructor, assuming objects created
   * by the `Object` constructor have no inherited enumerable properties and that
   * there are no `Object.prototype` extensions.
   *
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if `value` is a plain object, else `false`.
   */
  function isPlainFallback(value) {
    // avoid non-objects and false positives for `arguments` objects
    var result = false;
    if (!(value && typeof value == 'object') || isArguments(value)) {
      return result;
    }
    // IE < 9 presents DOM nodes as `Object` objects except they have `toString`
    // methods that are `typeof` "string" and still can coerce nodes to strings.
    // Also check that the constructor is `Object` (i.e. `Object instanceof Object`)
    var ctor = value.constructor;
    if ((!noNodeClass || !(typeof value.toString != 'function' && typeof (value + '') == 'string')) &&
        (!isFunction(ctor) || ctor instanceof ctor)) {
      // IE < 9 iterates inherited properties before own properties. If the first
      // iterated property is an object's own property then there are no inherited
      // enumerable properties.
      if (iteratesOwnLast) {
        forIn(value, function(value, key, object) {
          result = !hasOwnProperty.call(object, key);
          return false;
        });
        return result === false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return result === false || hasOwnProperty.call(value, result);
    }
    return result;
  }

  /**
   * A shim implementation of `Object.keys` that produces an array of the given
   * object's own enumerable property names.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns a new array of property names.
   */
  var shimKeys = createIterator({
    'args': 'object',
    'init': '[]',
    'top': 'if (!(object && objectTypes[typeof object])) throw TypeError()',
    'inLoop': 'result.push(index)'
  });

  /**
   * Used to convert characters to HTML entities:
   *
   * Though the `>` character is escaped for symmetry, characters like `>` and `/`
   * don't require escaping in HTML and have no special meaning unless they're part
   * of a tag or an unquoted attribute value.
   * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
   */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };

  /** Used to convert HTML entities to characters */
  var htmlUnescapes = invert(htmlEscapes);

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a clone of `value`. If `deep` is `true`, all nested objects will
   * also be cloned otherwise they will be assigned by reference. Functions, DOM
   * nodes, `arguments` objects, and objects created by constructors other than
   * `Object` are **not** cloned.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to clone.
   * @param {Boolean} deep A flag to indicate a deep clone.
   * @param- {Object} [guard] Internally used to allow this method to work with
   *  others like `_.map` without using their callback `index` argument for `deep`.
   * @param- {Array} [stackA=[]] Internally used to track traversed source objects.
   * @param- {Array} [stackB=[]] Internally used to associate clones with their
   *  source counterparts.
   * @returns {Mixed} Returns the cloned `value`.
   * @example
   *
   * var stooges = [
   *   { 'name': 'moe', 'age': 40 },
   *   { 'name': 'larry', 'age': 50 },
   *   { 'name': 'curly', 'age': 60 }
   * ];
   *
   * _.clone({ 'name': 'moe' });
   * // => { 'name': 'moe' }
   *
   * var shallow = _.clone(stooges);
   * shallow[0] === stooges[0];
   * // => true
   *
   * var deep = _.clone(stooges, true);
   * shallow[0] === stooges[0];
   * // => false
   */
  function clone(value, deep, guard, stackA, stackB) {
    if (value == null) {
      return value;
    }
    if (guard) {
      deep = false;
    }
    // inspect [[Class]]
    var isObj = objectTypes[typeof value];
    if (isObj) {
      // don't clone `arguments` objects, functions, or non-object Objects
      var className = toString.call(value);
      if (!cloneableClasses[className] || (noArgsClass && isArguments(value))) {
        return value;
      }
      var isArr = className == arrayClass;
      isObj = isArr || (className == objectClass ? isPlainObject(value) : isObj);
    }
    // shallow clone
    if (!isObj || !deep) {
      // don't clone functions
      return isObj
        ? (isArr ? slice.call(value) : extend({}, value))
        : value;
    }

    var ctor = value.constructor;
    switch (className) {
      case boolClass:
        return new ctor(value == true);

      case dateClass:
        return new ctor(+value);

      case numberClass:
      case stringClass:
        return new ctor(value);

      case regexpClass:
        return ctor(value.source, reFlags.exec(value));
    }

    // check for circular references and return corresponding clone
    stackA || (stackA = []);
    stackB || (stackB = []);

    var length = stackA.length;
    while (length--) {
      if (stackA[length] == value) {
        return stackB[length];
      }
    }

    // init cloned object
    var result = isArr ? ctor(length = value.length) : {};

    // add the source value to the stack of traversed objects
    // and associate it with its clone
    stackA.push(value);
    stackB.push(result);

    // recursively populate clone (susceptible to call stack limits)
    if (isArr) {
      var index = -1;
      while (++index < length) {
        result[index] = clone(value[index], deep, null, stackA, stackB);
      }
    } else {
      forOwn(value, function(objValue, key) {
        result[key] = clone(objValue, deep, null, stackA, stackB);
      });
    }
    return result;
  }

  /**
   * Assigns enumerable properties of the default object(s) to the `destination`
   * object for all `destination` properties that resolve to `null`/`undefined`.
   * Once a property is set, additional defaults of the same property will be
   * ignored.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The destination object.
   * @param {Object} [default1, default2, ...] The default objects.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * var iceCream = { 'flavor': 'chocolate' };
   * _.defaults(iceCream, { 'flavor': 'vanilla', 'sprinkles': 'rainbow' });
   * // => { 'flavor': 'chocolate', 'sprinkles': 'rainbow' }
   */
  var defaults = createIterator(extendIteratorOptions, {
    'inLoop': 'if (result[index] == null) ' + extendIteratorOptions.inLoop
  });

  /**
   * Assigns enumerable properties of the source object(s) to the `destination`
   * object. Subsequent sources will overwrite propery assignments of previous
   * sources.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The destination object.
   * @param {Object} [source1, source2, ...] The source objects.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * _.extend({ 'name': 'moe' }, { 'age': 40 });
   * // => { 'name': 'moe', 'age': 40 }
   */
  var extend = createIterator(extendIteratorOptions);

  /**
   * Iterates over `object`'s own and inherited enumerable properties, executing
   * the `callback` for each property. The `callback` is bound to `thisArg` and
   * invoked with three arguments; (value, key, object). Callbacks may exit iteration
   * early by explicitly returning `false`.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns `object`.
   * @example
   *
   * function Dog(name) {
   *   this.name = name;
   * }
   *
   * Dog.prototype.bark = function() {
   *   alert('Woof, woof!');
   * };
   *
   * _.forIn(new Dog('Dagny'), function(value, key) {
   *   alert(key);
   * });
   * // => alerts 'name' and 'bark' (order is not guaranteed)
   */
  var forIn = createIterator(baseIteratorOptions, forEachIteratorOptions, forOwnIteratorOptions, {
    'useHas': false
  });

  /**
   * Iterates over `object`'s own enumerable properties, executing the `callback`
   * for each property. The `callback` is bound to `thisArg` and invoked with three
   * arguments; (value, key, object). Callbacks may exit iteration early by explicitly
   * returning `false`.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns `object`.
   * @example
   *
   * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
   *   alert(key);
   * });
   * // => alerts '0', '1', and 'length' (order is not guaranteed)
   */
  var forOwn = createIterator(baseIteratorOptions, forEachIteratorOptions, forOwnIteratorOptions);

  /**
   * Creates a sorted array of all enumerable properties, own and inherited,
   * of `object` that have function values.
   *
   * @static
   * @memberOf _
   * @alias methods
   * @category Objects
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns a new array of property names that have function values.
   * @example
   *
   * _.functions(_);
   * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
   */
  var functions = createIterator({
    'useHas': false,
    'args': 'object',
    'init': '[]',
    'inLoop': 'if (isFunction(value)) result.push(index)',
    'bottom': 'result.sort()'
  });

  /**
   * Checks if the specified object `property` exists and is a direct property,
   * instead of an inherited property.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to check.
   * @param {String} property The property to check for.
   * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
   * @example
   *
   * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
   * // => true
   */
  function has(object, property) {
    return hasOwnProperty.call(object, property);
  }

  /**
   * Checks if `value` is a boolean (`true` or `false`) value.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a boolean value, else `false`.
   * @example
   *
   * _.isBoolean(null);
   * // => false
   */
  function isBoolean(value) {
    return value === true || value === false || toString.call(value) == boolClass;
  }

  /**
   * Checks if `value` is a date.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a date, else `false`.
   * @example
   *
   * _.isDate(new Date);
   * // => true
   */
  function isDate(value) {
    return toString.call(value) == dateClass;
  }

  /**
   * Checks if `value` is a DOM element.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a DOM element, else `false`.
   * @example
   *
   * _.isElement(document.body);
   * // => true
   */
  function isElement(value) {
    return value ? value.nodeType === 1 : false;
  }

  /**
   * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
   * length of `0` and objects with no own enumerable properties are considered
   * "empty".
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Array|Object|String} value The value to inspect.
   * @returns {Boolean} Returns `true` if the `value` is empty, else `false`.
   * @example
   *
   * _.isEmpty([1, 2, 3]);
   * // => false
   *
   * _.isEmpty({});
   * // => true
   *
   * _.isEmpty('');
   * // => true
   */
  var isEmpty = createIterator({
    'args': 'value',
    'init': 'true',
    'top':
      'if (!value) return result;\n' +
      'var className = toString.call(value),\n' +
      '    length = value.length;\n' +
      'if (arrayLikeClasses[className]' +
      (noArgsClass ? ' || isArguments(value)' : '') + ' ||\n' +
      '  (className == objectClass && length === +length &&\n' +
      '  isFunction(value.splice))' +
      ') return !length',
    'inLoop': {
      'object': 'return false'
    }
  });

  /**
   * Performs a deep comparison between two values to determine if they are
   * equivalent to each other.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} a The value to compare.
   * @param {Mixed} b The other value to compare.
   * @param- {Object} [stackA=[]] Internally used track traversed `a` objects.
   * @param- {Object} [stackB=[]] Internally used track traversed `b` objects.
   * @returns {Boolean} Returns `true` if the values are equvalent, else `false`.
   * @example
   *
   * var moe = { 'name': 'moe', 'luckyNumbers': [13, 27, 34] };
   * var clone = { 'name': 'moe', 'luckyNumbers': [13, 27, 34] };
   *
   * moe == clone;
   * // => false
   *
   * _.isEqual(moe, clone);
   * // => true
   */
  function isEqual(a, b, stackA, stackB) {
    // a strict comparison is necessary because `null == undefined`
    if (a == null || b == null) {
      return a === b;
    }
    // exit early for identical values
    if (a === b) {
      // treat `+0` vs. `-0` as not equal
      return a !== 0 || (1 / a == 1 / b);
    }
    // unwrap any `lodash` wrapped values
    if (objectTypes[typeof a] || objectTypes[typeof b]) {
      a = a.__wrapped__ || a;
      b = b.__wrapped__ || b;
    }
    // compare [[Class]] names
    var className = toString.call(a);
    if (className != toString.call(b)) {
      return false;
    }
    switch (className) {
      case boolClass:
      case dateClass:
        // coerce dates and booleans to numbers, dates to milliseconds and booleans
        // to `1` or `0`, treating invalid dates coerced to `NaN` as not equal
        return +a == +b;

      case numberClass:
        // treat `NaN` vs. `NaN` as equal
        return a != +a
          ? b != +b
          // but treat `+0` vs. `-0` as not equal
          : (a == 0 ? (1 / a == 1 / b) : a == +b);

      case regexpClass:
      case stringClass:
        // coerce regexes to strings (http://es5.github.com/#x15.10.6.4)
        // treat string primitives and their corresponding object instances as equal
        return a == b + '';
    }
    // exit early, in older browsers, if `a` is array-like but not `b`
    var isArr = arrayLikeClasses[className];
    if (noArgsClass && !isArr && (isArr = isArguments(a)) && !isArguments(b)) {
      return false;
    }
    // exit for functions and DOM nodes
    if (!isArr && (className != objectClass || (noNodeClass && (
        (typeof a.toString != 'function' && typeof (a + '') == 'string') ||
        (typeof b.toString != 'function' && typeof (b + '') == 'string'))))) {
      return false;
    }

    // assume cyclic structures are equal
    // the algorithm for detecting cyclic structures is adapted from ES 5.1
    // section 15.12.3, abstract operation `JO` (http://es5.github.com/#x15.12.3)
    stackA || (stackA = []);
    stackB || (stackB = []);

    var length = stackA.length;
    while (length--) {
      if (stackA[length] == a) {
        return stackB[length] == b;
      }
    }

    var index = -1,
        result = true,
        size = 0;

    // add `a` and `b` to the stack of traversed objects
    stackA.push(a);
    stackB.push(b);

    // recursively compare objects and arrays (susceptible to call stack limits)
    if (isArr) {
      // compare lengths to determine if a deep comparison is necessary
      size = a.length;
      result = size == b.length;

      if (result) {
        // deep compare the contents, ignoring non-numeric properties
        while (size--) {
          if (!(result = isEqual(a[size], b[size], stackA, stackB))) {
            break;
          }
        }
      }
      return result;
    }

    var ctorA = a.constructor,
        ctorB = b.constructor;

    // non `Object` object instances with different constructors are not equal
    if (ctorA != ctorB && !(
          isFunction(ctorA) && ctorA instanceof ctorA &&
          isFunction(ctorB) && ctorB instanceof ctorB
        )) {
      return false;
    }
    // deep compare objects
    for (var prop in a) {
      if (hasOwnProperty.call(a, prop)) {
        // count the number of properties.
        size++;
        // deep compare each property value.
        if (!(hasOwnProperty.call(b, prop) && isEqual(a[prop], b[prop], stackA, stackB))) {
          return false;
        }
      }
    }
    // ensure both objects have the same number of properties
    for (prop in b) {
      // The JS engine in Adobe products, like InDesign, has a bug that causes
      // `!size--` to throw an error so it must be wrapped in parentheses.
      // https://github.com/documentcloud/underscore/issues/355
      if (hasOwnProperty.call(b, prop) && !(size--)) {
        // `size` will be `-1` if `b` has more properties than `a`
        return false;
      }
    }
    // handle JScript [[DontEnum]] bug
    if (hasDontEnumBug) {
      while (++index < 7) {
        prop = shadowed[index];
        if (hasOwnProperty.call(a, prop) &&
            !(hasOwnProperty.call(b, prop) && isEqual(a[prop], b[prop], stackA, stackB))) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Checks if `value` is a finite number.
   *
   * Note: This is not the same as native `isFinite`, which will return true for
   * booleans and other values. See http://es5.github.com/#x15.1.2.5.
   *
   * @deprecated
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a finite number, else `false`.
   * @example
   *
   * _.isFinite(-101);
   * // => true
   *
   * _.isFinite('10');
   * // => false
   *
   * _.isFinite(Infinity);
   * // => false
   */
  function isFinite(value) {
    return nativeIsFinite(value) && toString.call(value) == numberClass;
  }

  /**
   * Checks if `value` is the language type of Object.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // check if the value is the ECMAScript language type of Object
    // http://es5.github.com/#x8
    // and avoid a V8 bug
    // http://code.google.com/p/v8/issues/detail?id=2291
    return value ? objectTypes[typeof value] : false;
  }

  /**
   * Checks if `value` is `NaN`.
   *
   * Note: This is not the same as native `isNaN`, which will return true for
   * `undefined` and other values. See http://es5.github.com/#x15.1.2.4.
   *
   * @deprecated
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is `NaN`, else `false`.
   * @example
   *
   * _.isNaN(NaN);
   * // => true
   *
   * _.isNaN(new Number(NaN));
   * // => true
   *
   * isNaN(undefined);
   * // => true
   *
   * _.isNaN(undefined);
   * // => false
   */
  function isNaN(value) {
    // `NaN` as a primitive is the only value that is not equal to itself
    // (perform the [[Class]] check first to avoid errors with some host objects in IE)
    return toString.call(value) == numberClass && value != +value
  }

  /**
   * Checks if `value` is `null`.
   *
   * @deprecated
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is `null`, else `false`.
   * @example
   *
   * _.isNull(null);
   * // => true
   *
   * _.isNull(undefined);
   * // => false
   */
  function isNull(value) {
    return value === null;
  }

  /**
   * Checks if `value` is a number.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a number, else `false`.
   * @example
   *
   * _.isNumber(8.4 * 5);
   * // => true
   */
  function isNumber(value) {
    return toString.call(value) == numberClass;
  }

  /**
   * Checks if `value` is a regular expression.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a regular expression, else `false`.
   * @example
   *
   * _.isRegExp(/moe/);
   * // => true
   */
  function isRegExp(value) {
    return toString.call(value) == regexpClass;
  }

  /**
   * Checks if `value` is a string.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a string, else `false`.
   * @example
   *
   * _.isString('moe');
   * // => true
   */
  function isString(value) {
    return toString.call(value) == stringClass;
  }

  /**
   * Checks if `value` is `undefined`.
   *
   * @deprecated
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is `undefined`, else `false`.
   * @example
   *
   * _.isUndefined(void 0);
   * // => true
   */
  function isUndefined(value) {
    return value === undefined;
  }

  /**
   * Creates an array composed of the own enumerable property names of `object`.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns a new array of property names.
   * @example
   *
   * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
   * // => ['one', 'two', 'three'] (order is not guaranteed)
   */
  var keys = !nativeKeys ? shimKeys : function(object) {
    // avoid iterating over the `prototype` property
    return typeof object == 'function' && propertyIsEnumerable.call(object, 'prototype')
      ? shimKeys(object)
      : nativeKeys(object);
  };

  /**
   * Merges enumerable properties of the source object(s) into the `destination`
   * object. Subsequent sources will overwrite propery assignments of previous
   * sources.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The destination object.
   * @param {Object} [source1, source2, ...] The source objects.
   * @param- {Object} [indicator] Internally used to indicate that the `stack`
   *  argument is an array of traversed objects instead of another source object.
   * @param- {Array} [stackA=[]] Internally used to track traversed source objects.
   * @param- {Array} [stackB=[]] Internally used to associate clones with their
   *  source counterparts.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * var stooges = [
   *   { 'name': 'moe' },
   *   { 'name': 'larry' }
   * ];
   *
   * var ages = [
   *   { 'age': 40 },
   *   { 'age': 50 }
   * ];
   *
   * _.merge(stooges, ages);
   * // => [{ 'name': 'moe', 'age': 40 }, { 'name': 'larry', 'age': 50 }]
   */
  var merge = createIterator(extendIteratorOptions, {
    'args': 'object, source, indicator',
    'top':
      'var isArr, args = arguments, argsIndex = 0;\n' +
      'if (indicator == compareAscending) {\n' +
      '  var argsLength = 2, stackA = args[3], stackB = args[4]\n' +
      '} else {\n' +
      '  var argsLength = args.length, stackA = [], stackB = []\n' +
      '}\n' +
      'while (++argsIndex < argsLength) {\n' +
      '  if (iteratee = args[argsIndex]) {',
    'inLoop':
      'if ((source = value) && ((isArr = isArray(source)) || isPlainObject(source))) {\n' +
      '  var found = false, stackLength = stackA.length;\n' +
      '  while (stackLength--) {\n' +
      '    if (found = stackA[stackLength] == source) break\n' +
      '  }\n' +
      '  if (found) {\n' +
      '    result[index] = stackB[stackLength]\n' +
      '  } else {\n' +
      '    stackA.push(source);\n' +
      '    stackB.push(value = (value = result[index]) && isArr\n' +
      '      ? (isArray(value) ? value : [])\n' +
      '      : (isPlainObject(value) ? value : {})\n' +
      '    );\n' +
      '    result[index] = callee(value, source, compareAscending, stackA, stackB)\n' +
      '  }\n' +
      '} else if (source != null) {\n' +
      '  result[index] = source\n' +
      '}'
  });

  /**
   * Creates a shallow clone of `object` excluding the specified properties.
   * Property names may be specified as individual arguments or as arrays of
   * property names. If `callback` is passed, it will be executed for each property
   * in the `object`, omitting the properties `callback` returns truthy for. The
   * `callback` is bound to `thisArg` and invoked with three arguments; (value, key, object).
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The source object.
   * @param {Function|String} callback|[prop1, prop2, ...] The properties to omit
   *  or the function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns an object without the omitted properties.
   * @example
   *
   * _.omit({ 'name': 'moe', 'age': 40, 'userid': 'moe1' }, 'userid');
   * // => { 'name': 'moe', 'age': 40 }
   *
   * _.omit({ 'name': 'moe', '_hint': 'knucklehead', '_seed': '96c4eb' }, function(value, key) {
   *   return key.charAt(0) == '_';
   * });
   * // => { 'name': 'moe' }
   */
  var omit = createIterator(omitIteratorOptions);

  /**
   * Creates a two dimensional array of the given object's key-value pairs,
   * i.e. `[[key1, value1], [key2, value2]]`.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns new array of key-value pairs.
   * @example
   *
   * _.pairs({ 'moe': 30, 'larry': 40, 'curly': 50 });
   * // => [['moe', 30], ['larry', 40], ['curly', 50]] (order is not guaranteed)
   */
  var pairs = createIterator({
    'args': 'object',
    'init':'[]',
    'inLoop': 'result'  + (isKeysFast ? '[ownIndex] = ' : '.push') + '([index, value])'
  });

  /**
   * Creates a shallow clone of `object` composed of the specified properties.
   * Property names may be specified as individual arguments or as arrays of
   * property names. If `callback` is passed, it will be executed for each property
   * in the `object`, picking the properties `callback` returns truthy for. The
   * `callback` is bound to `thisArg` and invoked with three arguments; (value, key, object).
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The source object.
   * @param {Function|String} callback|[prop1, prop2, ...] The properties to pick
   *  or the function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns an object composed of the picked properties.
   * @example
   *
   * _.pick({ 'name': 'moe', 'age': 40, 'userid': 'moe1' }, 'name', 'age');
   * // => { 'name': 'moe', 'age': 40 }
   *
   * _.pick({ 'name': 'moe', '_hint': 'knucklehead', '_seed': '96c4eb' }, function(value, key) {
   *   return key.charAt(0) != '_';
   * });
   * // => { 'name': 'moe' }
   */
  var pick = createIterator(omitIteratorOptions, {
    'top':
      'if (typeof callback != \'function\') {\n' +
      '  var prop,\n' +
      '      props = concat.apply(ArrayProto, arguments),\n' +
      '      length = props.length;\n' +
      '  for (index = 1; index < length; index++) {\n' +
      '    prop = props[index];\n' +
      '    if (prop in object) result[prop] = object[prop]\n' +
      '  }\n' +
      '} else {\n' +
      '  callback = createCallback(callback, thisArg)',
    'inLoop':
      'if (callback(value, index, object)) result[index] = value',
    'bottom': '}'
  });

  /**
   * Creates an array composed of the own enumerable property values of `object`.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns a new array of property values.
   * @example
   *
   * _.values({ 'one': 1, 'two': 2, 'three': 3 });
   * // => [1, 2, 3]
   */
  var values = createIterator({
    'args': 'object',
    'init': '[]',
    'inLoop': 'result.push(value)'
  });

  /*--------------------------------------------------------------------------*/

  /**
   * Checks if a given `target` element is present in a `collection` using strict
   * equality for comparisons, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @alias include
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Mixed} target The value to check for.
   * @returns {Boolean} Returns `true` if the `target` element is found, else `false`.
   * @example
   *
   * _.contains([1, 2, 3], 3);
   * // => true
   *
   * _.contains({ 'name': 'moe', 'age': 40 }, 'moe');
   * // => true
   *
   * _.contains('curly', 'ur');
   * // => true
   */
  var contains = createIterator({
    'args': 'collection, target',
    'init': 'false',
    'noCharByIndex': false,
    'beforeLoop': {
      'array': 'if (toString.call(collection) == stringClass) return collection.indexOf(target) > -1'
    },
    'inLoop': 'if (value === target) return true'
  });

  /**
   * Creates an object composed of keys returned from running each element of
   * `collection` through a `callback`. The corresponding value of each key is
   * the number of times the key was returned by `callback`. The `callback` is
   * bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
   * The `callback` argument may also be the name of a property to count by (e.g. 'length').
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function|String} callback|property The function called per iteration
   *  or property name to count by.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns the composed aggregate object.
   * @example
   *
   * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
   * // => { '4': 1, '6': 2 }
   *
   * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
   * // => { '4': 1, '6': 2 }
   *
   * _.countBy(['one', 'two', 'three'], 'length');
   * // => { '3': 2, '5': 1 }
   */
  var countBy = createIterator(baseIteratorOptions, countByIteratorOptions);

  /**
   * Checks if the `callback` returns a truthy value for **all** elements of a
   * `collection`. The `callback` is bound to `thisArg` and invoked with three
   * arguments; (value, index|key, collection).
   *
   * @static
   * @memberOf _
   * @alias all
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Boolean} Returns `true` if all elements pass the callback check,
   *  else `false`.
   * @example
   *
   * _.every([true, 1, null, 'yes'], Boolean);
   * // => false
   */
  var every = createIterator(baseIteratorOptions, everyIteratorOptions);

  /**
   * Examines each element in a `collection`, returning an array of all elements
   * the `callback` returns truthy for. The `callback` is bound to `thisArg` and
   * invoked with three arguments; (value, index|key, collection).
   *
   * @static
   * @memberOf _
   * @alias select
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array} Returns a new array of elements that passed the callback check.
   * @example
   *
   * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
   * // => [2, 4, 6]
   */
  var filter = createIterator(baseIteratorOptions, filterIteratorOptions);

  /**
   * Examines each element in a `collection`, returning the first one the `callback`
   * returns truthy for. The function returns as soon as it finds an acceptable
   * element, and does not iterate over the entire `collection`. The `callback` is
   * bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
   *
   * @static
   * @memberOf _
   * @alias detect
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Mixed} Returns the element that passed the callback check,
   *  else `undefined`.
   * @example
   *
   * var even = _.find([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
   * // => 2
   */
  var find = createIterator(baseIteratorOptions, forEachIteratorOptions, {
    'init': '',
    'inLoop': 'if (callback(value, index, collection)) return value'
  });

  /**
   * Iterates over a `collection`, executing the `callback` for each element in
   * the `collection`. The `callback` is bound to `thisArg` and invoked with three
   * arguments; (value, index|key, collection). Callbacks may exit iteration early
   * by explicitly returning `false`.
   *
   * @static
   * @memberOf _
   * @alias each
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array|Object|String} Returns `collection`.
   * @example
   *
   * _([1, 2, 3]).forEach(alert).join(',');
   * // => alerts each number and returns '1,2,3'
   *
   * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, alert);
   * // => alerts each number (order is not guaranteed)
   */
  var forEach = createIterator(baseIteratorOptions, forEachIteratorOptions);

  /**
   * Creates an object composed of keys returned from running each element of
   * `collection` through a `callback`. The corresponding value of each key is an
   * array of elements passed to `callback` that returned the key. The `callback`
   * is bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
   * The `callback` argument may also be the name of a property to count by (e.g. 'length').
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function|String} callback|property The function called per iteration
   *  or property name to group by.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns the composed aggregate object.
   * @example
   *
   * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
   * // => { '4': [4.2], '6': [6.1, 6.4] }
   *
   * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
   * // => { '4': [4.2], '6': [6.1, 6.4] }
   *
   * _.groupBy(['one', 'two', 'three'], 'length');
   * // => { '3': ['one', 'two'], '5': ['three'] }
   */
  var groupBy = createIterator(baseIteratorOptions, countByIteratorOptions, {
    'inLoop':
      'var prop = callback(value, index, collection);\n' +
      '(hasOwnProperty.call(result, prop) ? result[prop] : result[prop] = []).push(value)'
  });

  /**
   * Invokes the method named by `methodName` on each element in the `collection`,
   * returning an array of the results of each invoked method. Additional arguments
   * will be passed to each invoked method. If `methodName` is a function it will
   * be invoked for, and `this` bound to, each element in the `collection`.
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function|String} methodName The name of the method to invoke or
   *  the function invoked per iteration.
   * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
   * @returns {Array} Returns a new array of the results of each invoked method.
   * @example
   *
   * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
   * // => [[1, 5, 7], [1, 2, 3]]
   *
   * _.invoke([123, 456], String.prototype.split, '');
   * // => [['1', '2', '3'], ['4', '5', '6']]
   */
  var invoke = createIterator(mapIteratorOptions, {
    'args': 'collection, methodName',
    'top':
      'var args = slice.call(arguments, 2),\n' +
      '    isFunc = typeof methodName == \'function\'',
    'inLoop': {
      'array':
        'result[index] = (isFunc ? methodName : value[methodName]).apply(value, args)',
      'object':
        'result' + (isKeysFast ? '[ownIndex] = ' : '.push') +
        '((isFunc ? methodName : value[methodName]).apply(value, args))'
    }
  });

  /**
   * Creates an array of values by running each element in the `collection`
   * through a `callback`. The `callback` is bound to `thisArg` and invoked with
   * three arguments; (value, index|key, collection).
   *
   * @static
   * @memberOf _
   * @alias collect
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array} Returns a new array of the results of each `callback` execution.
   * @example
   *
   * _.map([1, 2, 3], function(num) { return num * 3; });
   * // => [3, 6, 9]
   *
   * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
   * // => [3, 6, 9] (order is not guaranteed)
   */
  var map = createIterator(baseIteratorOptions, mapIteratorOptions);

  /**
   * Retrieves the value of a specified property from all elements in
   * the `collection`.
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {String} property The property to pluck.
   * @returns {Array} Returns a new array of property values.
   * @example
   *
   * var stooges = [
   *   { 'name': 'moe', 'age': 40 },
   *   { 'name': 'larry', 'age': 50 },
   *   { 'name': 'curly', 'age': 60 }
   * ];
   *
   * _.pluck(stooges, 'name');
   * // => ['moe', 'larry', 'curly']
   */
  var pluck = createIterator(mapIteratorOptions, {
    'args': 'collection, property',
    'inLoop': {
      'array':  'result[index] = value[property]',
      'object': 'result' + (isKeysFast ? '[ownIndex] = ' : '.push') + '(value[property])'
    }
  });

  /**
   * Boils down a `collection` to a single value. The initial state of the
   * reduction is `accumulator` and each successive step of it should be returned
   * by the `callback`. The `callback` is bound to `thisArg` and invoked with 4
   * arguments; for arrays they are (accumulator, value, index|key, collection).
   *
   * @static
   * @memberOf _
   * @alias foldl, inject
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} [accumulator] Initial value of the accumulator.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Mixed} Returns the accumulated value.
   * @example
   *
   * var sum = _.reduce([1, 2, 3], function(memo, num) { return memo + num; });
   * // => 6
   */
  var reduce = createIterator({
    'args': 'collection, callback, accumulator, thisArg',
    'init': 'accumulator',
    'top':
      'var noaccum = arguments.length < 3;\n' +
      'callback = createCallback(callback, thisArg)',
    'beforeLoop': {
      'array': 'if (noaccum) result = iteratee[++index]'
    },
    'inLoop': {
      'array':
        'result = callback(result, value, index, collection)',
      'object':
        'result = noaccum\n' +
        '  ? (noaccum = false, value)\n' +
        '  : callback(result, value, index, collection)'
    }
  });

  /**
   * The right-associative version of `_.reduce`.
   *
   * @static
   * @memberOf _
   * @alias foldr
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} [accumulator] Initial value of the accumulator.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Mixed} Returns the accumulated value.
   * @example
   *
   * var list = [[0, 1], [2, 3], [4, 5]];
   * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
   * // => [4, 5, 2, 3, 0, 1]
   */
  function reduceRight(collection, callback, accumulator, thisArg) {
    var iteratee = collection,
        length = collection.length,
        noaccum = arguments.length < 3;

    if (length !== +length) {
      var props = keys(collection);
      length = props.length;
    } else if (noCharByIndex && toString.call(collection) == stringClass) {
      iteratee = collection.split('');
    }
    forEach(collection, function(value, index, object) {
      index = props ? props[--length] : --length;
      accumulator = noaccum
        ? (noaccum = false, iteratee[index])
        : callback.call(thisArg, accumulator, iteratee[index], index, object);
    });
    return accumulator;
  }

  /**
   * The opposite of `_.filter`, this method returns the values of a
   * `collection` that `callback` does **not** return truthy for.
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array} Returns a new array of elements that did **not** pass the
   *  callback check.
   * @example
   *
   * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
   * // => [1, 3, 5]
   */
  var reject = createIterator(baseIteratorOptions, filterIteratorOptions, {
    'inLoop': '!' + filterIteratorOptions.inLoop
  });

  /**
   * Gets the size of the `collection` by returning `collection.length` for arrays
   * and array-like objects or the number of own enumerable properties for objects.
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to inspect.
   * @returns {Number} Returns `collection.length` or number of own enumerable properties.
   * @example
   *
   * _.size([1, 2]);
   * // => 2
   *
   * _.size({ 'one': 1, 'two': 2, 'three': 3 });
   * // => 3
   *
   * _.size('curly');
   * // => 5
   */
  function size(collection) {
    var length = collection ? collection.length : 0;
    return length === +length ? length : keys(collection).length;
  }

  /**
   * Checks if the `callback` returns a truthy value for **any** element of a
   * `collection`. The function returns as soon as it finds passing value, and
   * does not iterate over the entire `collection`. The `callback` is bound to
   * `thisArg` and invoked with three arguments; (value, index|key, collection).
   *
   * @static
   * @memberOf _
   * @alias any
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Boolean} Returns `true` if any element passes the callback check,
   *  else `false`.
   * @example
   *
   * _.some([null, 0, 'yes', false]);
   * // => true
   */
  var some = createIterator(baseIteratorOptions, everyIteratorOptions, {
    'init': 'false',
    'inLoop': everyIteratorOptions.inLoop.replace('!', '')
  });

  /**
   * Creates an array, stable sorted in ascending order by the results of
   * running each element of `collection` through a `callback`. The `callback`
   * is bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
   * The `callback` argument may also be the name of a property to sort by (e.g. 'length').
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function|String} callback|property The function called per iteration
   *  or property name to sort by.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array} Returns a new array of sorted elements.
   * @example
   *
   * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
   * // => [3, 1, 2]
   *
   * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
   * // => [3, 1, 2]
   *
   * _.sortBy(['larry', 'brendan', 'moe'], 'length');
   * // => ['moe', 'larry', 'brendan']
   */
  var sortBy = createIterator(baseIteratorOptions, countByIteratorOptions, mapIteratorOptions, {
    'inLoop': {
      'array':
        'result[index] = {\n' +
        '  criteria: callback(value, index, collection),\n' +
        '  index: index,\n' +
        '  value: value\n' +
        '}',
      'object':
        'result' + (isKeysFast ? '[ownIndex] = ' : '.push') + '({\n' +
        '  criteria: callback(value, index, collection),\n' +
        '  index: index,\n' +
        '  value: value\n' +
        '})'
    },
    'bottom':
      'result.sort(compareAscending);\n' +
      'length = result.length;\n' +
      'while (length--) {\n' +
      '  result[length] = result[length].value\n' +
      '}'
  });

  /**
   * Converts the `collection`, to an array.
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to convert.
   * @returns {Array} Returns the new converted array.
   * @example
   *
   * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
   * // => [2, 3, 4]
   */
  function toArray(collection) {
    var length = collection ? collection.length : 0;
    if (length === +length) {
      return (noArraySliceOnStrings ? toString.call(collection) == stringClass : typeof collection == 'string')
        ? collection.split('')
        : slice.call(collection);
    }
    return values(collection);
  }

  /**
   * Examines each element in a `collection`, returning an array of all elements
   * that contain the given `properties`.
   *
   * @static
   * @memberOf _
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Object} properties The object of properties/values to filter by.
   * @returns {Array} Returns a new array of elements that contain the given `properties`.
   * @example
   *
   * var stooges = [
   *   { 'name': 'moe', 'age': 40 },
   *   { 'name': 'larry', 'age': 50 },
   *   { 'name': 'curly', 'age': 60 }
   * ];
   *
   * _.where(stooges, { 'age': 40 });
   * // => [{ 'name': 'moe', 'age': 40 }]
   */
  var where = createIterator(filterIteratorOptions, {
    'args': 'collection, properties',
    'top':
      'var props = [];\n' +
      'forIn(properties, function(value, prop) { props.push(prop) });\n' +
      'var propsLength = props.length',
    'inLoop':
      'for (var prop, pass = true, propIndex = 0; propIndex < propsLength; propIndex++) {\n' +
      '  prop = props[propIndex];\n' +
      '  if (!(pass = value[prop] === properties[prop])) break\n' +
      '}\n' +
      'pass && result.push(value)'
  });

  /*--------------------------------------------------------------------------*/

  /**
   * Creates an array with all falsey values of `array` removed. The values
   * `false`, `null`, `0`, `""`, `undefined` and `NaN` are all falsey.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to compact.
   * @returns {Array} Returns a new filtered array.
   * @example
   *
   * _.compact([0, 1, false, 2, '', 3]);
   * // => [1, 2, 3]
   */
  function compact(array) {
    var index = -1,
        length = array.length,
        result = [];

    while (++index < length) {
      if (array[index]) {
        result.push(array[index]);
      }
    }
    return result;
  }

  /**
   * Creates an array of `array` elements not present in the other arrays
   * using strict equality for comparisons, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to process.
   * @param {Array} [array1, array2, ...] Arrays to check.
   * @returns {Array} Returns a new array of `array` elements not present in the
   *  other arrays.
   * @example
   *
   * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
   * // => [1, 3, 4]
   */
  function difference(array) {
    var index = -1,
        length = array.length,
        flattened = concat.apply(ArrayProto, arguments),
        contains = cachedContains(flattened, length),
        result = [];

    while (++index < length) {
      if (!contains(array[index])) {
        result.push(array[index]);
      }
    }
    return result;
  }

  /**
   * Gets the first element of the `array`. Pass `n` to return the first `n`
   * elements of the `array`.
   *
   * @static
   * @memberOf _
   * @alias head, take
   * @category Arrays
   * @param {Array} array The array to query.
   * @param {Number} [n] The number of elements to return.
   * @param- {Object} [guard] Internally used to allow this method to work with
   *  others like `_.map` without using their callback `index` argument for `n`.
   * @returns {Mixed} Returns the first element or an array of the first `n`
   *  elements of `array`.
   * @example
   *
   * _.first([5, 4, 3, 2, 1]);
   * // => 5
   */
  function first(array, n, guard) {
    return (n == null || guard) ? array[0] : slice.call(array, 0, n);
  }

  /**
   * Flattens a nested array (the nesting can be to any depth). If `shallow` is
   * truthy, `array` will only be flattened a single level.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to compact.
   * @param {Boolean} shallow A flag to indicate only flattening a single level.
   * @returns {Array} Returns a new flattened array.
   * @example
   *
   * _.flatten([1, [2], [3, [[4]]]]);
   * // => [1, 2, 3, 4];
   *
   * _.flatten([1, [2], [3, [[4]]]], true);
   * // => [1, 2, 3, [[4]]];
   */
  function flatten(array, shallow) {
    var value,
        index = -1,
        length = array.length,
        result = [];

    while (++index < length) {
      value = array[index];

      // recursively flatten arrays (susceptible to call stack limits)
      if (isArray(value)) {
        push.apply(result, shallow ? value : flatten(value));
      } else {
        result.push(value);
      }
    }
    return result;
  }

  /**
   * Gets the index at which the first occurrence of `value` is found using
   * strict equality for comparisons, i.e. `===`. If the `array` is already
   * sorted, passing `true` for `isSorted` will run a faster binary search.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to search.
   * @param {Mixed} value The value to search for.
   * @param {Boolean|Number} [fromIndex=0] The index to start searching from or
   *  `true` to perform a binary search on a sorted `array`.
   * @returns {Number} Returns the index of the matched value or `-1`.
   * @example
   *
   * _.indexOf([1, 2, 3, 1, 2, 3], 2);
   * // => 1
   *
   * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
   * // => 4
   *
   * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
   * // => 2
   */
  function indexOf(array, value, fromIndex) {
    var index = -1,
        length = array.length;

    if (fromIndex) {
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) - 1;
      } else {
        index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
    }
    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Gets all but the last element of `array`. Pass `n` to exclude the last `n`
   * elements from the result.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to query.
   * @param {Number} [n] The number of elements to return.
   * @param- {Object} [guard] Internally used to allow this method to work with
   *  others like `_.map` without using their callback `index` argument for `n`.
   * @returns {Array} Returns all but the last element or `n` elements of `array`.
   * @example
   *
   * _.initial([3, 2, 1]);
   * // => [3, 2]
   */
  function initial(array, n, guard) {
    return slice.call(array, 0, -((n == null || guard) ? 1 : n));
  }

  /**
   * Computes the intersection of all the passed-in arrays using strict equality
   * for comparisons, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} [array1, array2, ...] Arrays to process.
   * @returns {Array} Returns a new array of unique elements, in order, that are
   *  present in **all** of the arrays.
   * @example
   *
   * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
   * // => [1, 2]
   */
  function intersection(array) {
    var value,
        argsLength = arguments.length,
        cache = [],
        index = -1,
        length = array.length,
        result = [];

    array: while (++index < length) {
      value = array[index];
      if (indexOf(result, value) < 0) {
        for (var argsIndex = 1; argsIndex < argsLength; argsIndex++) {
          if (!(cache[argsIndex] || (cache[argsIndex] = cachedContains(arguments[argsIndex])))(value)) {
            continue array;
          }
        }
        result.push(value);
      }
    }
    return result;
  }

  /**
   * Gets the last element of the `array`. Pass `n` to return the last `n`
   * elements of the `array`.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to query.
   * @param {Number} [n] The number of elements to return.
   * @param- {Object} [guard] Internally used to allow this method to work with
   *  others like `_.map` without using their callback `index` argument for `n`.
   * @returns {Mixed} Returns the last element or an array of the last `n`
   *  elements of `array`.
   * @example
   *
   * _.last([3, 2, 1]);
   * // => 1
   */
  function last(array, n, guard) {
    var length = array.length;
    return (n == null || guard) ? array[length - 1] : slice.call(array, -n || length);
  }

  /**
   * Gets the index at which the last occurrence of `value` is found using
   * strict equality for comparisons, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to search.
   * @param {Mixed} value The value to search for.
   * @param {Number} [fromIndex=array.length-1] The index to start searching from.
   * @returns {Number} Returns the index of the matched value or `-1`.
   * @example
   *
   * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
   * // => 4
   *
   * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
   * // => 1
   */
  function lastIndexOf(array, value, fromIndex) {
    var index = array.length;
    if (fromIndex && typeof fromIndex == 'number') {
      index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
    }
    while (index--) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Retrieves the maximum value of an `array`. If `callback` is passed,
   * it will be executed for each value in the `array` to generate the
   * criterion by which the value is ranked. The `callback` is bound to
   * `thisArg` and invoked with three arguments; (value, index, array).
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to iterate over.
   * @param {Function} [callback] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Mixed} Returns the maximum value.
   * @example
   *
   * var stooges = [
   *   { 'name': 'moe', 'age': 40 },
   *   { 'name': 'larry', 'age': 50 },
   *   { 'name': 'curly', 'age': 60 }
   * ];
   *
   * _.max(stooges, function(stooge) { return stooge.age; });
   * // => { 'name': 'curly', 'age': 60 };
   */
  function max(array, callback, thisArg) {
    var current,
        computed = -Infinity,
        index = -1,
        length = array ? array.length : 0,
        result = computed;

    callback = createCallback(callback, thisArg);
    while (++index < length) {
      current = callback(array[index], index, array);
      if (current > computed) {
        computed = current;
        result = array[index];
      }
    }
    return result;
  }

  /**
   * Retrieves the minimum value of an `array`. If `callback` is passed,
   * it will be executed for each value in the `array` to generate the
   * criterion by which the value is ranked. The `callback` is bound to `thisArg`
   * and invoked with three arguments; (value, index, array).
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to iterate over.
   * @param {Function} [callback] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Mixed} Returns the minimum value.
   * @example
   *
   * _.min([10, 5, 100, 2, 1000]);
   * // => 2
   */
  function min(array, callback, thisArg) {
    var current,
        computed = Infinity,
        index = -1,
        length = array ? array.length : 0,
        result = computed;

    callback = createCallback(callback, thisArg);
    while (++index < length) {
      current = callback(array[index], index, array);
      if (current < computed) {
        computed = current;
        result = array[index];
      }
    }
    return result;
  }

  /**
   * Creates an object composed from arrays of `keys` and `values`. Pass either
   * a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`, or
   * two arrays, one of `keys` and one of corresponding `values`.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} keys The array of keys.
   * @param {Array} [values=[]] The array of values.
   * @returns {Object} Returns an object composed of the given keys and
   *  corresponding values.
   * @example
   *
   * _.object(['moe', 'larry', 'curly'], [30, 40, 50]);
   * // => { 'moe': 30, 'larry': 40, 'curly': 50 }
   */
  function object(keys, values) {
    var index = -1,
        length = keys.length,
        result = {};

    while (++index < length) {
      if (values) {
        result[keys[index]] = values[index];
      } else {
        result[keys[index][0]] = keys[index][1];
      }
    }
    return result;
  }

  /**
   * Creates an array of numbers (positive and/or negative) progressing from
   * `start` up to but not including `stop`. This method is a port of Python's
   * `range()` function. See http://docs.python.org/library/functions.html#range.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Number} [start=0] The start of the range.
   * @param {Number} end The end of the range.
   * @param {Number} [step=1] The value to increment or descrement by.
   * @returns {Array} Returns a new range array.
   * @example
   *
   * _.range(10);
   * // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
   *
   * _.range(1, 11);
   * // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   *
   * _.range(0, 30, 5);
   * // => [0, 5, 10, 15, 20, 25]
   *
   * _.range(0, -10, -1);
   * // => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
   *
   * _.range(0);
   * // => []
   */
  function range(start, end, step) {
    start = +start || 0;
    step = +step || 1;

    if (end == null) {
      end = start;
      start = 0;
    }
    // use `Array(length)` so V8 will avoid the slower "dictionary" mode
    // http://www.youtube.com/watch?v=XAqIpGU8ZZk#t=16m27s
    var index = -1,
        length = nativeMax(0, Math.ceil((end - start) / step)),
        result = Array(length);

    while (++index < length) {
      result[index] = start;
      start += step;
    }
    return result;
  }

  /**
   * The opposite of `_.initial`, this method gets all but the first value of
   * `array`. Pass `n` to exclude the first `n` values from the result.
   *
   * @static
   * @memberOf _
   * @alias drop, tail
   * @category Arrays
   * @param {Array} array The array to query.
   * @param {Number} [n] The number of elements to return.
   * @param- {Object} [guard] Internally used to allow this method to work with
   *  others like `_.map` without using their callback `index` argument for `n`.
   * @returns {Array} Returns all but the first value or `n` values of `array`.
   * @example
   *
   * _.rest([3, 2, 1]);
   * // => [2, 1]
   */
  function rest(array, n, guard) {
    return slice.call(array, (n == null || guard) ? 1 : n);
  }

  /**
   * Creates an array of shuffled `array` values, using a version of the
   * Fisher-Yates shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to shuffle.
   * @returns {Array} Returns a new shuffled array.
   * @example
   *
   * _.shuffle([1, 2, 3, 4, 5, 6]);
   * // => [4, 1, 6, 3, 5, 2]
   */
  function shuffle(array) {
    var rand,
        index = -1,
        length = array.length,
        result = Array(length);

    while (++index < length) {
      rand = nativeFloor(nativeRandom() * (index + 1));
      result[index] = result[rand];
      result[rand] = array[index];
    }
    return result;
  }

  /**
   * Uses a binary search to determine the smallest index at which the `value`
   * should be inserted into `array` in order to maintain the sort order of the
   * sorted `array`. If `callback` is passed, it will be executed for `value` and
   * each element in `array` to compute their sort ranking. The `callback` is
   * bound to `thisArg` and invoked with one argument; (value). The `callback`
   * argument may also be the name of a property to order by.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to iterate over.
   * @param {Mixed} value The value to evaluate.
   * @param {Function|String} [callback=identity|property] The function called
   *  per iteration or property name to order by.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Number} Returns the index at which the value should be inserted
   *  into `array`.
   * @example
   *
   * _.sortedIndex([20, 30, 50], 40);
   * // => 2
   *
   * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
   * // => 2
   *
   * var dict = {
   *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
   * };
   *
   * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
   *   return dict.wordToNumber[word];
   * });
   * // => 2
   *
   * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
   *   return this.wordToNumber[word];
   * }, dict);
   * // => 2
   */
  function sortedIndex(array, value, callback, thisArg) {
    var mid,
        low = 0,
        high = array.length;

    callback = createCallback(callback, thisArg);
    value = callback(value);
    while (low < high) {
      mid = (low + high) >>> 1;
      callback(array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  }

  /**
   * Computes the union of the passed-in arrays using strict equality for
   * comparisons, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} [array1, array2, ...] Arrays to process.
   * @returns {Array} Returns a new array of unique values, in order, that are
   *  present in one or more of the arrays.
   * @example
   *
   * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
   * // => [1, 2, 3, 101, 10]
   */
  function union() {
    var index = -1,
        flattened = concat.apply(ArrayProto, arguments),
        length = flattened.length,
        result = [];

    while (++index < length) {
      if (indexOf(result, flattened[index]) < 0) {
        result.push(flattened[index]);
      }
    }
    return result;
  }

  /**
   * Creates a duplicate-value-free version of the `array` using strict equality
   * for comparisons, i.e. `===`. If the `array` is already sorted, passing `true`
   * for `isSorted` will run a faster algorithm. If `callback` is passed, each
   * element of `array` is passed through a callback` before uniqueness is computed.
   * The `callback` is bound to `thisArg` and invoked with three arguments; (value, index, array).
   *
   * @static
   * @memberOf _
   * @alias unique
   * @category Arrays
   * @param {Array} array The array to process.
   * @param {Boolean} [isSorted=false] A flag to indicate that the `array` is already sorted.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array} Returns a duplicate-value-free array.
   * @example
   *
   * _.uniq([1, 2, 1, 3, 1]);
   * // => [1, 2, 3]
   *
   * _.uniq([1, 1, 2, 2, 3], true);
   * // => [1, 2, 3]
   *
   * _.uniq([1, 2, 1.5, 3, 2.5], function(num) { return Math.floor(num); });
   * // => [1, 2, 3]
   *
   * _.uniq([1, 2, 1.5, 3, 2.5], function(num) { return this.floor(num); }, Math);
   * // => [1, 2, 3]
   */
  function uniq(array, isSorted, callback, thisArg) {
    var computed,
        index = -1,
        length = array.length,
        result = [],
        seen = [];

    // juggle arguments
    if (typeof isSorted == 'function') {
      thisArg = callback;
      callback = isSorted;
      isSorted = false;
    }
    callback = createCallback(callback, thisArg);
    while (++index < length) {
      computed = callback(array[index], index, array);
      if (isSorted
            ? !index || seen[seen.length - 1] !== computed
            : indexOf(seen, computed) < 0
          ) {
        seen.push(computed);
        result.push(array[index]);
      }
    }
    return result;
  }

  /**
   * Creates an array with all occurrences of the passed values removed using
   * strict equality for comparisons, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to filter.
   * @param {Mixed} [value1, value2, ...] Values to remove.
   * @returns {Array} Returns a new filtered array.
   * @example
   *
   * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
   * // => [2, 3, 4]
   */
  function without(array) {
    var index = -1,
        length = array.length,
        contains = cachedContains(arguments, 1, 20),
        result = [];

    while (++index < length) {
      if (!contains(array[index])) {
        result.push(array[index]);
      }
    }
    return result;
  }

  /**
   * Groups the elements of each array at their corresponding indexes. Useful for
   * separate data sources that are coordinated through matching array indexes.
   * For a matrix of nested arrays, `_.zip.apply(...)` can transpose the matrix
   * in a similar fashion.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} [array1, array2, ...] Arrays to process.
   * @returns {Array} Returns a new array of grouped elements.
   * @example
   *
   * _.zip(['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]);
   * // => [['moe', 30, true], ['larry', 40, false], ['curly', 50, false]]
   */
  function zip(array) {
    var index = -1,
        length = max(pluck(arguments, 'length')),
        result = Array(length);

    while (++index < length) {
      result[index] = pluck(arguments, index);
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a function that is restricted to executing only after it is
   * called `n` times.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Number} n The number of times the function must be called before
   * it is executed.
   * @param {Function} func The function to restrict.
   * @returns {Function} Returns the new restricted function.
   * @example
   *
   * var renderNotes = _.after(notes.length, render);
   * _.forEach(notes, function(note) {
   *   note.asyncSave({ 'success': renderNotes });
   * });
   * // `renderNotes` is run once, after all notes have saved
   */
  function after(n, func) {
    if (n < 1) {
      return func();
    }
    return function() {
      if (--n < 1) {
        return func.apply(this, arguments);
      }
    };
  }

  /**
   * Creates a function that, when called, invokes `func` with the `this`
   * binding of `thisArg` and prepends any additional `bind` arguments to those
   * passed to the bound function.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to bind.
   * @param {Mixed} [thisArg] The `this` binding of `func`.
   * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
   * @returns {Function} Returns the new bound function.
   * @example
   *
   * var func = function(greeting) {
   *   return greeting + ' ' + this.name;
   * };
   *
   * func = _.bind(func, { 'name': 'moe' }, 'hi');
   * func();
   * // => 'hi moe'
   */
  function bind(func, thisArg) {
    // use `Function#bind` if it exists and is fast
    // (in V8 `Function#bind` is slower except when partially applied)
    return isBindFast || (nativeBind && arguments.length > 2)
      ? nativeBind.call.apply(nativeBind, arguments)
      : createBound(func, thisArg, slice.call(arguments, 2));
  }

  /**
   * Binds methods on `object` to `object`, overwriting the existing method.
   * If no method names are provided, all the function properties of `object`
   * will be bound.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Object} object The object to bind and assign the bound methods to.
   * @param {String} [methodName1, methodName2, ...] Method names on the object to bind.
   * @returns {Object} Returns `object`.
   * @example
   *
   * var buttonView = {
   *  'label': 'lodash',
   *  'onClick': function() { alert('clicked: ' + this.label); }
   * };
   *
   * _.bindAll(buttonView);
   * jQuery('#lodash_button').on('click', buttonView.onClick);
   * // => When the button is clicked, `this.label` will have the correct value
   */
  var bindAll = createIterator({
    'useHas': false,
    'useStrict': false,
    'args': 'object',
    'top':
      'var funcs = arguments,\n' +
      '    length = funcs.length;\n' +
      'if (length > 1) {\n' +
      '  for (var index = 1; index < length; index++) {\n' +
      '    result[funcs[index]] = bind(result[funcs[index]], result)\n' +
      '  }\n' +
      '  return result\n' +
      '}',
    'inLoop':
      'if (isFunction(result[index])) {\n' +
      '  result[index] = bind(result[index], result)\n' +
      '}'
  });

  /**
   * Creates a function that is the composition of the passed functions,
   * where each function consumes the return value of the function that follows.
   * In math terms, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} [func1, func2, ...] Functions to compose.
   * @returns {Function} Returns the new composed function.
   * @example
   *
   * var greet = function(name) { return 'hi: ' + name; };
   * var exclaim = function(statement) { return statement + '!'; };
   * var welcome = _.compose(exclaim, greet);
   * welcome('moe');
   * // => 'hi: moe!'
   */
  function compose() {
    var funcs = arguments;
    return function() {
      var args = arguments,
          length = funcs.length;

      while (length--) {
        args = [funcs[length].apply(this, args)];
      }
      return args[0];
    };
  }

  /**
   * Creates a function that will delay the execution of `func` until after
   * `wait` milliseconds have elapsed since the last time it was invoked. Pass
   * `true` for `immediate` to cause debounce to invoke `func` on the leading,
   * instead of the trailing, edge of the `wait` timeout. Subsequent calls to
   * the debounced function will return the result of the last `func` call.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to debounce.
   * @param {Number} wait The number of milliseconds to delay.
   * @param {Boolean} immediate A flag to indicate execution is on the leading
   *  edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * var lazyLayout = _.debounce(calculateLayout, 300);
   * jQuery(window).on('resize', lazyLayout);
   */
  function debounce(func, wait, immediate) {
    var args,
        result,
        thisArg,
        timeoutId;

    function delayed() {
      timeoutId = null;
      if (!immediate) {
        result = func.apply(thisArg, args);
      }
    }

    return function() {
      var isImmediate = immediate && !timeoutId;
      args = arguments;
      thisArg = this;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(delayed, wait);

      if (isImmediate) {
        result = func.apply(thisArg, args);
      }
      return result;
    };
  }

  /**
   * Executes the `func` function after `wait` milliseconds. Additional arguments
   * will be passed to `func` when it is invoked.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to delay.
   * @param {Number} wait The number of milliseconds to delay execution.
   * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
   * @returns {Number} Returns the `setTimeout` timeout id.
   * @example
   *
   * var log = _.bind(console.log, console);
   * _.delay(log, 1000, 'logged later');
   * // => 'logged later' (Appears after one second.)
   */
  function delay(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function() { return func.apply(undefined, args); }, wait);
  }

  /**
   * Defers executing the `func` function until the current call stack has cleared.
   * Additional arguments will be passed to `func` when it is invoked.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to defer.
   * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
   * @returns {Number} Returns the `setTimeout` timeout id.
   * @example
   *
   * _.defer(function() { alert('deferred'); });
   * // returns from the function before `alert` is called
   */
  function defer(func) {
    var args = slice.call(arguments, 1);
    return setTimeout(function() { return func.apply(undefined, args); }, 1);
  }

  /**
   * Creates a function that, when called, invokes `object[methodName]` and
   * prepends any additional `lateBind` arguments to those passed to the bound
   * function. This method differs from `_.bind` by allowing bound functions to
   * reference methods that will be redefined or don't yet exist.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Object} object The object the method belongs to.
   * @param {String} methodName The method name.
   * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
   * @returns {Function} Returns the new bound function.
   * @example
   *
   * var object = {
   *   'name': 'moe',
   *   'greet': function(greeting) {
   *     return greeting + ' ' + this.name;
   *   }
   * };
   *
   * var func = _.lateBind(object, 'greet', 'hi');
   * func();
   * // => 'hi moe'
   *
   * object.greet = function(greeting) {
   *   return greeting + ', ' + this.name + '!';
   * };
   *
   * func();
   * // => 'hi, moe!'
   */
  function lateBind(object, methodName) {
    return createBound(methodName, object, slice.call(arguments, 2));
  }

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * passed, it will be used to determine the cache key for storing the result
   * based on the arguments passed to the memoized function. By default, the first
   * argument passed to the memoized function is used as the cache key.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] A function used to resolve the cache key.
   * @returns {Function} Returns the new memoizing function.
   * @example
   *
   * var fibonacci = _.memoize(function(n) {
   *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
   * });
   */
  function memoize(func, resolver) {
    var cache = {};
    return function() {
      var prop = resolver ? resolver.apply(this, arguments) : arguments[0];
      return hasOwnProperty.call(cache, prop)
        ? cache[prop]
        : (cache[prop] = func.apply(this, arguments));
    };
  }

  /**
   * Creates a function that is restricted to one execution. Repeat calls to
   * the function will return the value of the first call.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to restrict.
   * @returns {Function} Returns the new restricted function.
   * @example
   *
   * var initialize = _.once(createApplication);
   * initialize();
   * initialize();
   * // Application is only created once.
   */
  function once(func) {
    var result,
        ran = false;

    return function() {
      if (ran) {
        return result;
      }
      ran = true;
      result = func.apply(this, arguments);

      // clear the `func` variable so the function may be garbage collected
      func = null;
      return result;
    };
  }

  /**
   * Creates a function that, when called, invokes `func` with any additional
   * `partial` arguments prepended to those passed to the new function. This method
   * is similar to `bind`, except it does **not** alter the `this` binding.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to partially apply arguments to.
   * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
   * @returns {Function} Returns the new partially applied function.
   * @example
   *
   * var greet = function(greeting, name) { return greeting + ': ' + name; };
   * var hi = _.partial(greet, 'hi');
   * hi('moe');
   * // => 'hi: moe'
   */
  function partial(func) {
    return createBound(func, slice.call(arguments, 1));
  }

  /**
   * Creates a function that, when executed, will only call the `func`
   * function at most once per every `wait` milliseconds. If the throttled
   * function is invoked more than once during the `wait` timeout, `func` will
   * also be called on the trailing edge of the timeout. Subsequent calls to the
   * throttled function will return the result of the last `func` call.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to throttle.
   * @param {Number} wait The number of milliseconds to throttle executions to.
   * @returns {Function} Returns the new throttled function.
   * @example
   *
   * var throttled = _.throttle(updatePosition, 100);
   * jQuery(window).on('scroll', throttled);
   */
  function throttle(func, wait) {
    var args,
        result,
        thisArg,
        timeoutId,
        lastCalled = 0;

    function trailingCall() {
      lastCalled = new Date;
      timeoutId = null;
      result = func.apply(thisArg, args);
    }

    return function() {
      var now = new Date,
          remain = wait - (now - lastCalled);

      args = arguments;
      thisArg = this;

      if (remain <= 0) {
        lastCalled = now;
        result = func.apply(thisArg, args);
      }
      else if (!timeoutId) {
        timeoutId = setTimeout(trailingCall, remain);
      }
      return result;
    };
  }

  /**
   * Creates a function that passes `value` to the `wrapper` function as its
   * first argument. Additional arguments passed to the new function are appended
   * to those passed to the `wrapper` function.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Mixed} value The value to wrap.
   * @param {Function} wrapper The wrapper function.
   * @returns {Function} Returns the new function.
   * @example
   *
   * var hello = function(name) { return 'hello: ' + name; };
   * hello = _.wrap(hello, function(func) {
   *   return 'before, ' + func('moe') + ', after';
   * });
   * hello();
   * // => 'before, hello: moe, after'
   */
  function wrap(value, wrapper) {
    return function() {
      var args = [value];
      if (arguments.length) {
        push.apply(args, arguments);
      }
      return wrapper.apply(this, args);
    };
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
   * corresponding HTML entities.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {String} string The string to escape.
   * @returns {String} Returns the escaped string.
   * @example
   *
   * _.escape('Moe, Larry & Curly');
   * // => "Moe, Larry &amp; Curly"
   */
  function escape(string) {
    return string == null ? '' : (string + '').replace(reUnescapedHtml, escapeHtmlChar);
  }

  /**
   * This function returns the first argument passed to it.
   *
   * Note: It is used throughout Lo-Dash as a default callback.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Mixed} value Any value.
   * @returns {Mixed} Returns `value`.
   * @example
   *
   * var moe = { 'name': 'moe' };
   * moe === _.identity(moe);
   * // => true
   */
  function identity(value) {
    return value;
  }

  /**
   * Adds functions properties of `object` to the `lodash` function and chainable
   * wrapper.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} object The object of function properties to add to `lodash`.
   * @example
   *
   * _.mixin({
   *   'capitalize': function(string) {
   *     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
   *   }
   * });
   *
   * _.capitalize('larry');
   * // => 'Larry'
   *
   * _('curly').capitalize();
   * // => 'Curly'
   */
  function mixin(object) {
    forEach(functions(object), function(methodName) {
      var func = lodash[methodName] = object[methodName];

      lodash.prototype[methodName] = function() {
        var args = [this.__wrapped__];
        if (arguments.length) {
          push.apply(args, arguments);
        }
        var result = func.apply(lodash, args);
        if (this.__chain__) {
          result = new lodash(result);
          result.__chain__ = true;
        }
        return result;
      };
    });
  }

  /**
   * Reverts the '_' variable to its previous value and returns a reference to
   * the `lodash` function.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @returns {Function} Returns the `lodash` function.
   * @example
   *
   * var lodash = _.noConflict();
   */
  function noConflict() {
    window._ = oldDash;
    return this;
  }

  /**
   * Produces a random number between `min` and `max` (inclusive). If only one
   * argument is passed, a number between `0` and the given number will be returned.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Number} [min=0] The minimum possible value.
   * @param {Number} [max=1] The maximum possible value.
   * @returns {Number} Returns a random number.
   * @example
   *
   * _.random(0, 5);
   * // => a number between 1 and 5
   *
   * _.random(5);
   * // => also a number between 1 and 5
   */
  function random(min, max) {
    if (min == null && max == null) {
      max = 1;
    }
    min = +min || 0;
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + nativeFloor(nativeRandom() * ((+max || 0) - min + 1));
  }

  /**
   * Resolves the value of `property` on `object`. If `property` is a function
   * it will be invoked and its result returned, else the property value is
   * returned. If `object` is falsey, then `null` is returned.
   *
   * @deprecated
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} object The object to inspect.
   * @param {String} property The property to get the value of.
   * @returns {Mixed} Returns the resolved value.
   * @example
   *
   * var object = {
   *   'cheese': 'crumpets',
   *   'stuff': function() {
   *     return 'nonsense';
   *   }
   * };
   *
   * _.result(object, 'cheese');
   * // => 'crumpets'
   *
   * _.result(object, 'stuff');
   * // => 'nonsense'
   */
  function result(object, property) {
    // based on Backbone's private `getValue` function
    // https://github.com/documentcloud/backbone/blob/0.9.2/backbone.js#L1419-1424
    var value = object ? object[property] : null;
    return isFunction(value) ? object[property]() : value;
  }

  /**
   * A micro-templating method that handles arbitrary delimiters, preserves
   * whitespace, and correctly escapes quotes within interpolated code.
   *
   * Note: In the development build `_.template` utilizes sourceURLs for easier
   * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
   *
   * Note: Lo-Dash may be used in Chrome extensions by either creating a `lodash csp`
   * build and avoiding `_.template` use, or loading Lo-Dash in a sandboxed page.
   * See http://developer.chrome.com/trunk/extensions/sandboxingEval.html
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {String} text The template text.
   * @param {Obect} data The data object used to populate the text.
   * @param {Object} options The options object.
   * @returns {Function|String} Returns a compiled function when no `data` object
   *  is given, else it returns the interpolated text.
   * @example
   *
   * // using a compiled template
   * var compiled = _.template('hello: <%= name %>');
   * compiled({ 'name': 'moe' });
   * // => 'hello: moe'
   *
   * var list = '<% _.forEach(people, function(name) { %><li><%= name %></li><% }); %>';
   * _.template(list, { 'people': ['moe', 'larry', 'curly'] });
   * // => '<li>moe</li><li>larry</li><li>curly</li>'
   *
   * // using the "escape" delimiter to escape HTML in data property values
   * _.template('<b><%- value %></b>', { 'value': '<script>' });
   * // => '<b>&lt;script></b>'
   *
   * // using the internal `print` function in "evaluate" delimiters
   * _.template('<% print("Hello " + epithet); %>.', { 'epithet': 'stooge' });
   * // => 'Hello stooge.'
   *
   * // using custom template delimiter settings
   * _.templateSettings = {
   *   'interpolate': /\{\{([\s\S]+?)\}\}/g
   * };
   *
   * _.template('Hello {{ name }}!', { 'name': 'Mustache' });
   * // => 'Hello Mustache!'
   *
   * // using the `variable` option to ensure a with-statement isn't used in the compiled template
   * var compiled = _.template('hello: <%= data.name %>', null, { 'variable': 'data' });
   * compiled.source;
   * // => function(data) {
   *   var __t, __p = '', __e = _.escape;
   *   __p += 'hello: ' + ((__t = ( data.name )) == null ? '' : __t);
   *   return __p;
   * }
   *
   * // using the `source` property to inline compiled templates for meaningful
   * // line numbers in error messages and a stack trace
   * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
   *   var JST = {\
   *     "main": ' + _.template(mainText).source + '\
   *   };\
   * ');
   */
  function template(text, data, options) {
    // based on John Resig's `tmpl` implementation
    // http://ejohn.org/blog/javascript-micro-templating/
    // and Laura Doktorova's doT.js
    // https://github.com/olado/doT
    options || (options = {});

    var isEvaluating,
        result,
        index = 0,
        settings = lodash.templateSettings,
        source = "__p += '",
        variable = options.variable || settings.variable,
        hasVariable = variable;

    // compile regexp to match each delimiter
    var reDelimiters = RegExp(
      (options.escape || settings.escape || reNoMatch).source + '|' +
      (options.interpolate || settings.interpolate || reNoMatch).source + '|' +
      (options.evaluate || settings.evaluate || reNoMatch).source + '|$'
    , 'g');

    text.replace(reDelimiters, function(match, escapeValue, interpolateValue, evaluateValue, offset) {
      // escape characters that cannot be included in string literals
      source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

      // replace delimiters with snippets
      source +=
        escapeValue ? "' +\n__e(" + escapeValue + ") +\n'" :
        evaluateValue ? "';\n" + evaluateValue + ";\n__p += '" :
        interpolateValue ? "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'" : '';

      isEvaluating || (isEvaluating = evaluateValue || reComplexDelimiter.test(escapeValue || interpolateValue));
      index = offset + match.length;
    });

    source += "';\n";

    // if `variable` is not specified and the template contains "evaluate"
    // delimiters, wrap a with-statement around the generated code to add the
    // data object to the top of the scope chain
    if (!hasVariable) {
      variable = 'obj';
      if (isEvaluating) {
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      else {
        // avoid a with-statement by prepending data object references to property names
        var reDoubleVariable = RegExp('(\\(\\s*)' + variable + '\\.' + variable + '\\b', 'g');
        source = source
          .replace(reInsertVariable, '$&' + variable + '.')
          .replace(reDoubleVariable, '$1__d');
      }
    }

    // cleanup code by stripping empty strings
    source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
      .replace(reEmptyStringMiddle, '$1')
      .replace(reEmptyStringTrailing, '$1;');

    // frame code as the function body
    source = 'function(' + variable + ') {\n' +
      (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
      'var __t, __p = \'\', __e = _.escape' +
      (isEvaluating
        ? ', __j = Array.prototype.join;\n' +
          'function print() { __p += __j.call(arguments, \'\') }\n'
        : (hasVariable ? '' : ', __d = ' + variable + '.' + variable + ' || ' + variable) + ';\n'
      ) +
      source +
      'return __p\n}';

    // use a sourceURL for easier debugging
    // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
    var sourceURL = useSourceURL
      ? '\n//@ sourceURL=/lodash/template/source[' + (templateCounter++) + ']'
      : '';

    try {
      result = Function('_', 'return ' + source + sourceURL)(lodash);
    } catch(e) {
      e.source = source;
      throw e;
    }

    if (data) {
      return result(data);
    }
    // provide the compiled function's source via its `toString` method, in
    // supported environments, or the `source` property as a convenience for
    // inlining compiled templates during the build process
    result.source = source;
    return result;
  }

  /**
   * Executes the `callback` function `n` times, returning an array of the results
   * of each `callback` execution. The `callback` is bound to `thisArg` and invoked
   * with one argument; (index).
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Number} n The number of times to execute the callback.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array} Returns a new array of the results of each `callback` execution.
   * @example
   *
   * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
   * // => [3, 6, 4]
   *
   * _.times(3, function(n) { mage.castSpell(n); });
   * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
   *
   * _.times(3, function(n) { this.cast(n); }, mage);
   * // => also calls `mage.castSpell(n)` three times
   */
  function times(n, callback, thisArg) {
    n = +n || 0;
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = callback.call(thisArg, index);
    }
    return result;
  }

  /**
   * Converts the HTML entities `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#x27;`
   * in `string` to their corresponding characters.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {String} string The string to unescape.
   * @returns {String} Returns the unescaped string.
   * @example
   *
   * _.unescape('Moe, Larry &amp; Curly');
   * // => "Moe, Larry & Curly"
   */
  function unescape(string) {
    return string == null ? '' : (string + '').replace(reEscapedHtml, unescapeHtmlChar);
  }

  /**
   * Generates a unique id. If `prefix` is passed, the id will be appended to it.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {String} [prefix] The value to prefix the id with.
   * @returns {Number|String} Returns a numeric id if no prefix is passed, else
   *  a string id may be returned.
   * @example
   *
   * _.uniqueId('contact_');
   * // => 'contact_104'
   */
  function uniqueId(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Wraps the value in a `lodash` wrapper object.
   *
   * @static
   * @memberOf _
   * @category Chaining
   * @param {Mixed} value The value to wrap.
   * @returns {Object} Returns the wrapper object.
   * @example
   *
   * var stooges = [
   *   { 'name': 'moe', 'age': 40 },
   *   { 'name': 'larry', 'age': 50 },
   *   { 'name': 'curly', 'age': 60 }
   * ];
   *
   * var youngest = _.chain(stooges)
   *     .sortBy(function(stooge) { return stooge.age; })
   *     .map(function(stooge) { return stooge.name + ' is ' + stooge.age; })
   *     .first()
   *     .value();
   * // => 'moe is 40'
   */
  function chain(value) {
    value = new lodash(value);
    value.__chain__ = true;
    return value;
  }

  /**
   * Invokes `interceptor` with the `value` as the first argument, and then
   * returns `value`. The purpose of this method is to "tap into" a method chain,
   * in order to perform operations on intermediate results within the chain.
   *
   * @static
   * @memberOf _
   * @category Chaining
   * @param {Mixed} value The value to pass to `interceptor`.
   * @param {Function} interceptor The function to invoke.
   * @returns {Mixed} Returns `value`.
   * @example
   *
   * _.chain([1, 2, 3, 200])
   *  .filter(function(num) { return num % 2 == 0; })
   *  .tap(alert)
   *  .map(function(num) { return num * num })
   *  .value();
   * // => // [2, 200] (alerted)
   * // => [4, 40000]
   */
  function tap(value, interceptor) {
    interceptor(value);
    return value;
  }

  /**
   * Enables method chaining on the wrapper object.
   *
   * @name chain
   * @deprecated
   * @memberOf _
   * @category Chaining
   * @returns {Mixed} Returns the wrapper object.
   * @example
   *
   * _([1, 2, 3]).value();
   * // => [1, 2, 3]
   */
  function wrapperChain() {
    this.__chain__ = true;
    return this;
  }

  /**
   * Extracts the wrapped value.
   *
   * @name value
   * @memberOf _
   * @category Chaining
   * @returns {Mixed} Returns the wrapped value.
   * @example
   *
   * _([1, 2, 3]).value();
   * // => [1, 2, 3]
   */
  function wrapperValue() {
    return this.__wrapped__;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The semantic version number.
   *
   * @static
   * @memberOf _
   * @type String
   */
  lodash.VERSION = '0.8.0';

  // assign static methods
  lodash.after = after;
  lodash.bind = bind;
  lodash.bindAll = bindAll;
  lodash.chain = chain;
  lodash.clone = clone;
  lodash.compact = compact;
  lodash.compose = compose;
  lodash.contains = contains;
  lodash.countBy = countBy;
  lodash.debounce = debounce;
  lodash.defaults = defaults;
  lodash.defer = defer;
  lodash.delay = delay;
  lodash.difference = difference;
  lodash.escape = escape;
  lodash.every = every;
  lodash.extend = extend;
  lodash.filter = filter;
  lodash.find = find;
  lodash.first = first;
  lodash.flatten = flatten;
  lodash.forEach = forEach;
  lodash.forIn = forIn;
  lodash.forOwn = forOwn;
  lodash.functions = functions;
  lodash.groupBy = groupBy;
  lodash.has = has;
  lodash.identity = identity;
  lodash.indexOf = indexOf;
  lodash.initial = initial;
  lodash.intersection = intersection;
  lodash.invert = invert;
  lodash.invoke = invoke;
  lodash.isArguments = isArguments;
  lodash.isArray = isArray;
  lodash.isBoolean = isBoolean;
  lodash.isDate = isDate;
  lodash.isElement = isElement;
  lodash.isEmpty = isEmpty;
  lodash.isEqual = isEqual;
  lodash.isFinite = isFinite;
  lodash.isFunction = isFunction;
  lodash.isNaN = isNaN;
  lodash.isNull = isNull;
  lodash.isNumber = isNumber;
  lodash.isObject = isObject;
  lodash.isPlainObject = isPlainObject;
  lodash.isRegExp = isRegExp;
  lodash.isString = isString;
  lodash.isUndefined = isUndefined;
  lodash.keys = keys;
  lodash.last = last;
  lodash.lastIndexOf = lastIndexOf;
  lodash.lateBind = lateBind;
  lodash.map = map;
  lodash.max = max;
  lodash.memoize = memoize;
  lodash.merge = merge;
  lodash.min = min;
  lodash.mixin = mixin;
  lodash.noConflict = noConflict;
  lodash.object = object;
  lodash.omit = omit;
  lodash.once = once;
  lodash.pairs = pairs;
  lodash.partial = partial;
  lodash.pick = pick;
  lodash.pluck = pluck;
  lodash.random = random;
  lodash.range = range;
  lodash.reduce = reduce;
  lodash.reduceRight = reduceRight;
  lodash.reject = reject;
  lodash.rest = rest;
  lodash.result = result;
  lodash.shuffle = shuffle;
  lodash.size = size;
  lodash.some = some;
  lodash.sortBy = sortBy;
  lodash.sortedIndex = sortedIndex;
  lodash.tap = tap;
  lodash.template = template;
  lodash.throttle = throttle;
  lodash.times = times;
  lodash.toArray = toArray;
  lodash.unescape = unescape;
  lodash.union = union;
  lodash.uniq = uniq;
  lodash.uniqueId = uniqueId;
  lodash.values = values;
  lodash.where = where;
  lodash.without = without;
  lodash.wrap = wrap;
  lodash.zip = zip;

  // assign aliases
  lodash.all = every;
  lodash.any = some;
  lodash.collect = map;
  lodash.detect = find;
  lodash.drop = rest;
  lodash.each = forEach;
  lodash.foldl = reduce;
  lodash.foldr = reduceRight;
  lodash.head = first;
  lodash.include = contains;
  lodash.inject = reduce;
  lodash.methods = functions;
  lodash.select = filter;
  lodash.tail = rest;
  lodash.take = first;
  lodash.unique = uniq;

  // add pseudo private properties used and removed during the build process
  lodash._iteratorTemplate = iteratorTemplate;
  lodash._shimKeys = shimKeys;

  /*--------------------------------------------------------------------------*/

  // add all static functions to `lodash.prototype`
  mixin(lodash);

  // add `lodash.prototype.chain` after calling `mixin()` to avoid overwriting
  // it with the wrapped `lodash.chain`
  lodash.prototype.chain = wrapperChain;
  lodash.prototype.value = wrapperValue;

  // add all mutator Array functions to the wrapper.
  forEach(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(methodName) {
    var func = ArrayProto[methodName];

    lodash.prototype[methodName] = function() {
      var value = this.__wrapped__;
      func.apply(value, arguments);

      // avoid array-like object bugs with `Array#shift` and `Array#splice` in
      // Firefox < 10 and IE < 9
      if (hasObjectSpliceBug && value.length === 0) {
        delete value[0];
      }
      if (this.__chain__) {
        value = new lodash(value);
        value.__chain__ = true;
      }
      return value;
    };
  });

  // add all accessor Array functions to the wrapper.
  forEach(['concat', 'join', 'slice'], function(methodName) {
    var func = ArrayProto[methodName];

    lodash.prototype[methodName] = function() {
      var value = this.__wrapped__,
          result = func.apply(value, arguments);

      if (this.__chain__) {
        result = new lodash(result);
        result.__chain__ = true;
      }
      return result;
    };
  });

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash was injected by a third-party script and not intended to be
    // loaded as a module. The global assignment can be reverted in the Lo-Dash
    // module via its `noConflict()` method.
    window._ = lodash;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define('lodash', [], function() {
      return lodash;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports) {
    // in Node.js or RingoJS v0.8.0+
    if (typeof module == 'object' && module && module.exports == freeExports) {
      (module.exports = lodash)._ = lodash;
    }
    // in Narwhal or RingoJS v0.7.0-
    else {
      freeExports._ = lodash;
    }
  }
  else {
    // in a browser or Rhino
    window._ = lodash;
  }
}(this));
// Generated by CoffeeScript 1.3.3

/*

  Harvey, A Second Face for Your Application's JavaScript

  Copyright 2012, Joschka Kintscher
  Released under the MIT License

  https://github.com/harvesthq/harvey/
*/


(function() {
  var State, _mediaQueryList;

  this.Harvey = (function() {

    function Harvey() {}

    Harvey.states = {};

    /*
        Creates a new State object for the given media query using the passed hash
        of callbacks and stores it in @states. The passed hash may contain up to
        three callbacks. See documentation of the State class for more information.
    */


    Harvey.attach = function(mediaQuery, callbacks) {
      var state;
      if (!this.states.hasOwnProperty(mediaQuery)) {
        this.states[mediaQuery] = [];
        this._add_css_for(mediaQuery);
      }
      state = new State(mediaQuery, callbacks != null ? callbacks.setup : void 0, callbacks != null ? callbacks.on : void 0, callbacks != null ? callbacks.off : void 0);
      if (!this.states[mediaQuery].length) {
        this._watch_query(mediaQuery);
      }
      this.states[mediaQuery].push(state);
      if (this._window_matchmedia(mediaQuery).matches) {
        this._update_states([state], true);
      }
      return state;
    };

    /*
        Removes a given State object from the @states hash.
    
        @param  object  state  A valid state object
    */


    Harvey.detach = function(state) {
      var i, s, _i, _len, _ref, _results;
      _ref = this.states[state.condition];
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        s = _ref[i];
        if (state === s) {
          _results.push(this.states[s.condition][i] = void 0);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    /*
        Create a new matchMediaListener for the passed media query.
    
        @param  string  mediaQuery  A valid CSS media query to watch
    */


    Harvey._watch_query = function(mediaQuery) {
      var _this = this;
      return this._window_matchmedia(mediaQuery).addListener(function(mql) {
        return _this._update_states(_this.states[mediaQuery], mql.matches);
      });
    };

    /*
        Activates/Deactivates every State object in the passed list.
    
        @param  array   states  A list of State objects to update
        @param  boolean active Whether to activate or deactivate the given states
    */


    Harvey._update_states = function(states, active) {
      var state, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = states.length; _i < _len; _i++) {
        state = states[_i];
        if (active) {
          _results.push(state.activate());
        } else {
          _results.push(state.deactivate());
        }
      }
      return _results;
    };

    /*
        BEWARE: You're at the edge of the map, mate. Here there be monsters!
    
        ------------------------------------------------------------------------------------
    
        Private methods to fix and polyfill the matchMedia interface for several engines
    
        * Inspired by Nicholas C. Zakas' article on the different problems with matchMedia
          http://www.nczonline.net/blog/2012/01/19/css-media-queries-in-javascript-part-2/
    
        * Implementing a modified coffeescript version of Scott Jehl's and Paul Irish's matchMedia.js polyfill
          https://github.com/paulirish/matchMedia.js
    */


    /*
        [FIX] for Firefox/Gecko browsers that lose reference to the
              MediaQueryList object unless it's being stored for runtime.
    */


    Harvey._mediaList = {};

    /*
        @param  string  mediaQuery      A valid CSS media query to monitor for updates
        @Return object  MediaQueryList  Depending on the browser and matchMedia support either a native
                                        mediaQueryList object or an instance of _mediaQueryList
    */


    Harvey._window_matchmedia = function(mediaQuery) {
      if (window.matchMedia) {
        if (!(mediaQuery in this._mediaList)) {
          this._mediaList[mediaQuery] = window.matchMedia(mediaQuery);
        }
        return this._mediaList[mediaQuery];
      }
      /*
            [POLYFILL] for all browsers that don't support matchMedia() at all (CSS media query support
                       is still mandatory though).
      */

      if (!this._listening) {
        this._listen();
      }
      if (!(mediaQuery in this._mediaList)) {
        this._mediaList[mediaQuery] = new _mediaQueryList(mediaQuery);
      }
      return this._mediaList[mediaQuery];
    };

    /*
        Add resize and orientationChange event listeners to the window element
        to monitor updates to the viewport
    */


    Harvey._listen = function() {
      var evt,
        _this = this;
      evt = window.addEventListener || window.attachEvent;
      evt('resize', function() {
        var mediaList, mediaQuery, _ref, _results;
        _ref = _this._mediaList;
        _results = [];
        for (mediaQuery in _ref) {
          mediaList = _ref[mediaQuery];
          _results.push(mediaList._process());
        }
        return _results;
      });
      evt('orientationChange', function() {
        var mediaList, mediaQuery, _ref, _results;
        _ref = _this._mediaList;
        _results = [];
        for (mediaQuery in _ref) {
          mediaList = _ref[mediaQuery];
          _results.push(mediaList._process());
        }
        return _results;
      });
      return this._listening = true;
    };

    /*
        [FIX] for Webkit engines that only trigger the MediaQueryListListener
              when there is at least one CSS selector for the respective media query
    
        @param  string  MediaQuery  The media query to inject CSS for
    */


    Harvey._add_css_for = function(mediaQuery) {
      if (!this.style) {
        this.style = document.createElement('style');
        this.style.setAttribute('type', 'text/css');
        document.getElementsByTagName('head')[0].appendChild(this.style);
      }
      mediaQuery = "@media " + mediaQuery + " {.harvey-test{}}";
      if (!this.style.styleSheet) {
        return this.style.appendChild(document.createTextNode(mediaQuery));
      }
    };

    return Harvey;

  })();

  /*
    A State allows to execute a set of callbacks for the given valid CSS media query.
  
    Callbacks are executed in the context of their state object to allow access to the
    corresponding media query of the State.
  
    States are not exposed to the global namespace. They can be used by calling the
    static Harvey.attach() and Harvey.detach() methods.
  */


  State = (function() {

    State.prototype.active = false;

    State.prototype.is_setup = false;

    /*
        Creates a new State object
    
        @param  string    condition The media query to check for
        @param  function  setup     Called the first time `condition` becomes valid
        @param  function  on        Called every time `condition` becomes valid
        @param  function  off       Called every time `condition` becomes invalid
    */


    function State(condition, setup, on, off) {
      this.condition = condition;
      this.setup = setup;
      this.on = on;
      this.off = off;
    }

    /*
        Activate this State object if it is currently deactivated. Also perform all
        set up tasks if this is the first time the State is activated
    */


    State.prototype.activate = function() {
      if (this.active) {
        return;
      }
      if (!this.is_setup) {
        if (typeof this.setup === "function") {
          this.setup();
        }
        this.is_setup = true;
      }
      if (typeof this.on === "function") {
        this.on();
      }
      return this.active = true;
    };

    /*
        Deactive this State object if it is currently active
    */


    State.prototype.deactivate = function() {
      if (!this.active) {
        return;
      }
      if (typeof this.off === "function") {
        this.off();
      }
      return this.active = false;
    };

    return State;

  })();

  /*
    [FIX] simple implemenation of the matchMedia interface to mimic the native
          matchMedia interface behaviour to work as a polyfill for Harvey
  */


  _mediaQueryList = (function() {
    /*
        Creates a new _mediaQueryList object
    
        @param  string  media  A valid CSS media query
    */

    function _mediaQueryList(media) {
      this.media = media;
      this._listeners = [];
      this.matches = this._matches();
    }

    /*
        Add a new listener to this mediaQueryList that will be called every time
        the media query becomes valid
    */


    _mediaQueryList.prototype.addListener = function(listener) {
      this._listeners.push(listener);
      return void 0;
    };

    /*
        Evaluate the media query of this mediaQueryList object and notify
        all registered listeners if the state has changed
    */


    _mediaQueryList.prototype._process = function() {
      var callback, current, _i, _len, _ref, _results;
      current = this._matches();
      if (this.matches === current) {
        return;
      }
      this.matches = current;
      _ref = this._listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback(this));
      }
      return _results;
    };

    /*
        Check whether the media query is currently valid
    */


    _mediaQueryList.prototype._matches = function() {
      if (!this._tester) {
        this._get_tester();
      }
      this._tester.innerHTML = '&shy;<style media="' + this.media + '">#harvey-mq-test{width:42px;}</style>';
      this._tester.removeChild(this._tester.firstChild);
      return this._tester.offsetWidth === 42;
    };

    /*
        Retrieve the element to test the media query on from the DOM or create
        it if it has not been injected into the page yet
    */


    _mediaQueryList.prototype._get_tester = function() {
      this._tester = document.getElementById('harvey-mq-test');
      if (!this._tester) {
        return this._build_tester();
      }
    };

    /*
        Create a new div with a unique id, move it outsite of the viewport and inject it into the DOM.
        This element will be used to check whether the registered media query is currently valid.
    */


    _mediaQueryList.prototype._build_tester = function() {
      this._tester = document.createElement('div');
      this._tester.id = 'harvey-mq-test';
      this._tester.style.cssText = 'position:absolute;top:-100em';
      return document.body.insertBefore(this._tester, document.body.firstChild);
    };

    return _mediaQueryList;

  })();

}).call(this);
/* 
 * Text Utilities - jquery plugins to help with sizing text to fit.
 * Requires jQuery and Underscore/Lodash (for debouncing resize events)
 * 
 * 
 */
( function( $, _ ) {
	
	$.fn.fitText = function( options ) {
		return $( this ).each( function() {
			var $text = $( this ),
				context = {
					maxWidth: $text.parent().width(),
					maxHeight: $text.parent().height(),
					originalFontSize: $text.css( 'font-size' )
				},
				textHeight = $text.height(),
				textWidth = $text.width(),
				fontSize = parseInt( $text.css('font-size' ), 10 );
			while( ( textHeight > context.maxHeight || textWidth > context.maxWidth ) && fontSize > 12 ) {
				fontSize = fontSize - 1;
				$text.css('font-size', fontSize );
				textHeight = $text.height();
				textWidth = $text.width();
			}
		} );
	};
	
	$.fn.verticallyCenter = function( options ) {
		return $( this ).each( function() {
			var $text = $( this ),
				attribute = 'margin-top',
				resizer = function() {
					// get parent height minus own height and devide by 2
					$text.css(
						attribute, ( ( $text.parent().height() - $text.height() ) / 2 )
					);
				};
			resizer();
			$(window).on('resize', resizer);
		} );
	};

	/*
	 * 	fitTextOnLine 
	 *	Does pretty much what you'd assume it would. Takes a line of text and makes sure it all 
	 *	fits on one line.
	 *
	 * TODO: do the calculations offscreen, with a clone of the DOM being scaled, then apply the 
	 * final text size to the original element. You shouldn't be messing with anything except
	 * the font-size rule.
	 *
	 */
	$.fn.fitTextOnLine = function( options ) {

		return $( this ).each( function() {
			var $text = $( this ),
				context = {
					maxWidth: $text.parent().width(),
					originalFontSize: $text.css( 'font-size' ),
					originalDisplay: $text.css( 'display' )
				},
				textWidth,
				maxFontSize = 140,
				minFontSize = 12,
				initialFontSize = 12,
				fontSize = initialFontSize,
				resizer = _.throttle( function() {
					if ( $text.css( 'display' ) === 'none' ) return;
					context.maxWidth = $text.parent().width();
					$text.css( { 'display': 'inline' } );
					// scale up
					while( ( textWidth < context.maxWidth ) && fontSize < maxFontSize ) {
						fontSize++;
						$text.css( { 'font-size': fontSize,
									 'line-height': fontSize + 'px' } );
						textWidth = $text.width();
						if ( ( textWidth >= context.maxWidth ) || fontSize >= maxFontSize ) {
							// last iteration
							$text.css( 'display', context.originalDisplay );
						}
					}
					// scale down
					while( ( textWidth > context.maxWidth ) && fontSize > minFontSize ) {
						fontSize--;
						$text.css( { 'font-size': fontSize,
									 'line-height': fontSize + 'px' } );
						textWidth = $text.width();
						if ( ( textWidth >= context.maxWidth ) || fontSize >= maxFontSize ) {
							// last iteration
							$text.css( 'display', context.originalDisplay );
						}
					}
				}, 100);
		
			$text.css( {
				'font-size': initialFontSize,
				'whiteSpace': 'nowrap',
				'display': 'inline' } );
			textWidth = $text.width()
	      	// Call once to set.
	      	resizer();
					
	      	// Call on resize. Opera debounces their resize by default. 
	      	$(window).on('resize', resizer);
			
		} );
	};

}( jQuery, _ ) );
/*
 * ytVideo - A jQuery plugin to handle embeding youtube videos with the API
 * "http://www.youtube.com/embed/n_MM1eazcjY?rel=0&amp;hd=1&amp;wmode=transparent&amp;fmt=22&enablejsapi=1&playerapiid=ytplayer"
 * Usage: 
 * Create an iframe like this:
 * <iframe width="625" height="380" class="yt-video" src="http://www.youtube.com/embed/n_MM1eazcjY?rel=0&amp;hd=1&amp;wmode=transparent&amp;fmt=22&enablejsapi=1" frameborder="0" allowfullscreen>
 * </iframe>
 * 
 * OR create a div like this: 
 *  <div class="yt-video" style="width:625;height=380px" data-yt-ref="n_MM1eazcjY"></div>
 *
 * Then on document.ready run this: 
 *   $( '.yt-video' ).ytVideo();
 *
 *
 *
 *
 */
( function( $ ) {
	
	var yt = {
		config: {
			'stepperInterval': null
		},
		options: {
			width: 640,
			height: 360,
			quality: 'large',
			playerVars: {
				'autoplay': 1
			}
		},
		evt: {
			'onapiready': function( e ) {
				var context = e.data.context;
				yt.fn.setup( context );
			},
			'onReady': function( context, e ) {
				e.target.cueVideoById( context.videoID, 0, context.quality );
			},
			'onStateChange': function( context, e ) {
				// rebroadcast trackable events
				switch( e.data ) {
					case 1:
						// playing -- bind the stepper
						context.stepperInterval = setInterval( function() {
							yt.fn.playbackStep( context );
						}, 1000 );
						// trigger play
						context.$container.trigger( 'play.ytVideo', context );
						break;
					case 2: 
						// trigger pause
						context.$container.trigger( 'pause.ytVideo', context );
						// paused -- unbind the stepper
						clearInterval( context.stepperInterval );
						break;
				}
			}
		},
		fn: {
			init: function( context ) {
				if ( 'YT' in window && 'Player' in YT ) {
					yt.fn.setup( context );
				} else {
					$( window ).bind( 'youtubeplayerapiready.ytVideo', { context: context }, yt.evt.onapiready );
				}
			},
			setup: function( context ) {
				yt.fn.setID( context );
				yt.fn.embed( context );
			},
			setID: function( context ) {
				if ( context.$video.is( 'iframe' ) ) {
					context.videoID = context.$video.attr('src').match(/\/embed\/([a-zA-Z0-9\_\-]+)/)[1];
				} else {
					context.videoID = context.$video.data( 'yt-ref' );
					context.videoID = context.videoID || context.$video.data( 'video-yt' );
				}
				context.elID = context.$container.attr( 'id' );
				context.$video.removeClass( 'yt-video' );
				if ( typeof( context.elID ) === 'undefined' || context.elID === null || context.elID === '' ) {
					// set a random ID if one has not been set
					context.elID = 'ytVideo-' + Math.ceil(Math.random()*(new Date()).getTime()); 
					context.$video.attr( 'id', context.elID );
				}
			},
			embed: function( context ) {
				var playerParameters = {
					'height': context.height,
					'width': context.width,
					'playerVars': context.playerVars,
					'events': {
						'onReady': function( e ) {
							yt.evt.onReady( context, e );
						},
						'onStateChange': function( e ) {
							yt.evt.onStateChange( context, e );
						}
					}
				};
				if ( context.videoID ) {
					playerParameters.videoId = context.videoID;
				}
				playerParameters.playerVars.wmode = 'transparent';
				playerParameters.enablejsapi = 1;
				playerParameters.origin = window.location.host;
				context.player = new YT.Player( context.elID, playerParameters );
			},
			// triggered once a second durring playback
			'playbackStep': function( context ) {
				context.$container.trigger( 'playback.ytVideo', context );
			}
		}
	};
	
	$.ytVideo = yt;

	$.fn.ytVideo = function ( options ) {
		options = options || {};
		return $( this ).each( function() {
			var context = {},
				$video = $( this ),
				$container;
			// ensure we don't re-initialize our videos
			if ( ! $video.data( 'ytVideoContext' ) ) {
				// wrap
				$container = $video.wrap( '<div class="yt-video"></div>' ).parent()
				// attempt to set the width and height options from the container, if they're not passed in
				options.aspectRatio = options.aspectRatio || 16/9;
				options.width = options.width || $container.width();
				options.height = options.height || options.width / options.aspectRatio;

				context = $.extend( context, yt.options, options, yt.config );
				context.$container = $container;
				context.$video = $video;
				context.$container.data( 'ytVideo-context', context );
				yt.fn.init( context );
			}
		} );
	};
	
	window.onYouTubePlayerAPIReady = function() {
		$( window ).trigger( 'youtubeplayerapiready' );
	};
}( jQuery ) );
/* ===================================================
 * bootstrap-transition.js v2.1.1
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  $(function () {

    "use strict"; // jshint ;_;


    /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
     * ======================================================= */

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd otransitionend'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);
/* =============================================================
 * bootstrap-collapse.js v2.1.1
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      $.support.transition && this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSIBLE PLUGIN DEFINITION
  * ============================== */

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = typeof option == 'object' && option
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSIBLE DATA-API
  * ==================== */

  $(function () {
    $('body').on('click.collapse.data-api', '[data-toggle=collapse]', function (e) {
      var $this = $(this), href
        , target = $this.attr('data-target')
          || e.preventDefault()
          || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
        , option = $(target).data('collapse') ? 'toggle' : $this.data()
      $this[$(target).hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
      $(target).collapse(option)
    })
  })

}(window.jQuery);
/* ===========================================================
 * bootstrap-tooltip.js v2.1.1
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      if (this.options.trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (this.options.trigger != 'manual') {
        eventIn = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
        eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
        this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , inside
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp

      if (this.hasContent() && this.enabled) {
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        inside = /in/.test(placement)

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .appendTo(inside ? this.$element : document.body)

        pos = this.getPosition(inside)

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (inside ? placement.split(' ')[1] : placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        $tip
          .css(tp)
          .addClass(placement)
          .addClass('in')
      }
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).remove()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.remove()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.remove()

      return this
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function (inside) {
      return $.extend({}, (inside ? {top: 0, left: 0} : this.$element.offset()), {
        width: this.$element[0].offsetWidth
      , height: this.$element[0].offsetHeight
      })
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function () {
      this[this.tip().hasClass('in') ? 'hide' : 'show']()
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover'
  , title: ''
  , delay: 0
  , html: true
  }

}(window.jQuery);

/* ===========================================================
 * bootstrap-popover.js v2.1.1
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }


  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
      $tip.find('.popover-content > *')[this.options.html ? 'html' : 'text'](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = $e.attr('data-content')
        || (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)

      return content
    }

  , tip: function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  $.fn.popover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , trigger: 'click'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-affix.js v2.1.1
 * http://twitter.github.com/bootstrap/javascript.html#affix
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* AFFIX CLASS DEFINITION
  * ====================== */

  var Affix = function (element, options) {
    this.options = $.extend({}, $.fn.affix.defaults, options)
    this.$window = $(window).on('scroll.affix.data-api', $.proxy(this.checkPosition, this))
    this.$element = $(element)
    this.checkPosition()
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
      , scrollTop = this.$window.scrollTop()
      , position = this.$element.offset()
      , offset = this.options.offset
      , offsetBottom = offset.bottom
      , offsetTop = offset.top
      , reset = 'affix affix-top affix-bottom'
      , affix

    if (typeof offset != 'object') offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function') offsetTop = offset.top()
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom()

    affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ?
      false    : offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ?
      'bottom' : offsetTop != null && scrollTop <= offsetTop ?
      'top'    : false

    if (this.affixed === affix) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? position.top - scrollTop : null

    this.$element.removeClass(reset).addClass('affix' + (affix ? '-' + affix : ''))
  }


 /* AFFIX PLUGIN DEFINITION
  * ======================= */

  $.fn.affix = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('affix')
        , options = typeof option == 'object' && option
      if (!data) $this.data('affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.affix.Constructor = Affix

  $.fn.affix.defaults = {
    offset: 0
  }


 /* AFFIX DATA-API
  * ============== */

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
        , data = $spy.data()

      data.offset = data.offset || {}

      data.offsetBottom && (data.offset.bottom = data.offsetBottom)
      data.offsetTop && (data.offset.top = data.offsetTop)

      $spy.affix(data)
    })
  })


}(window.jQuery);
/*
 *  jQuery selectBox - A cosmetic, styleable replacement for SELECT elements
 *
 *  Copyright 2012 Cory LaViska for A Beautiful Site, LLC.
 *
 *  https://github.com/claviska/jquery-selectBox
 *
 *  Licensed under both the MIT license and the GNU GPLv2 (same as jQuery: http://jquery.org/license)
 *
 */
if (jQuery)(function($) {
	$.extend($.fn, {
		selectBox: function(method, data) {
			var typeTimer, typeSearch = '',
				isMac = navigator.platform.match(/mac/i);
			//
			// Private methods
			//
			var init = function(select, data) {
					var options;
					// Disable for iOS devices (their native controls are more suitable for a touch device)
					if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;
					// Element must be a select control
					if (select.tagName.toLowerCase() !== 'select') return false;
					select = $(select);
					if (select.data('selectBox-control')) return false;
					var control = $('<a class="selectBox" />'),
						inline = select.attr('multiple') || parseInt(select.attr('size')) > 1;
					var settings = data || {};
					control//.width(select.outerWidth()) -- no thanks
						.addClass(select.attr('class')).attr('title', select.attr('title') || '').attr('tabindex', parseInt(select.attr('tabindex'))).css('display', 'inline-block').bind('focus.selectBox', function() {
						if (this !== document.activeElement && document.body !== document.activeElement) $(document.activeElement).blur();
						if (control.hasClass('selectBox-active')) return;
						control.addClass('selectBox-active');
						select.trigger('focus');
					}).bind('blur.selectBox', function() {
						if (!control.hasClass('selectBox-active')) return;
						control.removeClass('selectBox-active');
						select.trigger('blur');
					});
					if (!$(window).data('selectBox-bindings')) {
						$(window).data('selectBox-bindings', true).bind('scroll.selectBox', hideMenus).bind('resize.selectBox', hideMenus);
					}
					if (select.attr('disabled')) control.addClass('selectBox-disabled');
					// Focus on control when label is clicked
					select.bind('click.selectBox', function(event) {
						control.focus();
						event.preventDefault();
					});
					// Generate control
					if (inline) {
						//
						// Inline controls
						//
						options = getOptions(select, 'inline');
						control.append(options).data('selectBox-options', options).addClass('selectBox-inline selectBox-menuShowing').bind('keydown.selectBox', function(event) {
							handleKeyDown(select, event);
						}).bind('keypress.selectBox', function(event) {
							handleKeyPress(select, event);
						}).bind('mousedown.selectBox', function(event) {
							if ($(event.target).is('A.selectBox-inline')) event.preventDefault();
							if (!control.hasClass('selectBox-focus')) control.focus();
						}).insertAfter(select);
						// Auto-height based on size attribute
						if (!select[0].style.height) {
							var size = select.attr('size') ? parseInt(select.attr('size')) : 5;
							// Draw a dummy control off-screen, measure, and remove it
							var tmp = control.clone().removeAttr('id').css({
								position: 'absolute',
								top: '-9999em'
							}).show().appendTo('body');
							tmp.find('.selectBox-options').html('<li><a>\u00A0</a></li>');
							var optionHeight = parseInt(tmp.find('.selectBox-options A:first').html('&nbsp;').outerHeight());
							tmp.remove();
							control.height(optionHeight * size);
						}
						disableSelection(control);
					} else {
						//
						// Dropdown controls
						//
						var label = $('<span class="selectBox-label" />'),
							arrow = $('<span class="selectBox-arrow" />');
						// Update label
						label.attr('class', getLabelClass(select)).text(getLabelText(select));
						options = getOptions(select, 'dropdown');
						options.appendTo('BODY');
						control.data('selectBox-options', options).addClass('selectBox-dropdown').append(label).append(arrow).bind('mousedown.selectBox', function(event) {
							if (control.hasClass('selectBox-menuShowing')) {
								hideMenus();
							} else {
								event.stopPropagation();
								// Webkit fix to prevent premature selection of options
								options.data('selectBox-down-at-x', event.screenX).data('selectBox-down-at-y', event.screenY);
								showMenu(select);
							}
						}).bind('keydown.selectBox', function(event) {
							handleKeyDown(select, event);
						}).bind('keypress.selectBox', function(event) {
							handleKeyPress(select, event);
						}).bind('open.selectBox', function(event, triggerData) {
							if (triggerData && triggerData._selectBox === true) return;
							showMenu(select);
						}).bind('close.selectBox', function(event, triggerData) {
							if (triggerData && triggerData._selectBox === true) return;
							hideMenus();
						}).insertAfter(select);
						// Set label width
						var labelWidth = control.width() - arrow.outerWidth() - parseInt(label.css('paddingLeft')) - parseInt(label.css('paddingLeft'));
						// label.width(labelWidth); -- again, we'll pass
						disableSelection(control);
					}
					// Store data for later use and show the control
					select.addClass('selectBox').data('selectBox-control', control).data('selectBox-settings', settings).hide();
				};
			var getOptions = function(select, type) {
					var options;
					// Private function to handle recursion in the getOptions function.
					var _getOptions = function(select, options) {
							// Loop through the set in order of element children.
							select.children('OPTION, OPTGROUP').each(function() {
								// If the element is an option, add it to the list.
								if ($(this).is('OPTION')) {
									// Check for a value in the option found.
									if ($(this).length > 0) {
										// Create an option form the found element.
										generateOptions($(this), options);
									} else {
										// No option information found, so add an empty.
										options.append('<li>\u00A0</li>');
									}
								} else {
									// If the element is an option group, add the group and call this function on it.
									var optgroup = $('<li class="selectBox-optgroup" />');
									optgroup.text($(this).attr('label'));
									options.append(optgroup);
									options = _getOptions($(this), options);
								}
							});
							// Return the built strin
							return options;
						};
					switch (type) {
					case 'inline':
						options = $('<ul class="selectBox-options" />');
						options = _getOptions(select, options);
						options.find('A').bind('mouseover.selectBox', function(event) {
							addHover(select, $(this).parent());
						}).bind('mouseout.selectBox', function(event) {
							removeHover(select, $(this).parent());
						}).bind('mousedown.selectBox', function(event) {
							event.preventDefault(); // Prevent options from being "dragged"
							if (!select.selectBox('control').hasClass('selectBox-active')) select.selectBox('control').focus();
						}).bind('mouseup.selectBox', function(event) {
							hideMenus();
							selectOption(select, $(this).parent(), event);
						});
						disableSelection(options);
						return options;
					case 'dropdown':
						options = $('<ul class="selectBox-dropdown-menu selectBox-options" />');
						options = _getOptions(select, options);
						options.data('selectBox-select', select).css('display', 'none').appendTo('BODY').find('A').bind('mousedown.selectBox', function(event) {
							event.preventDefault(); // Prevent options from being "dragged"
							if (event.screenX === options.data('selectBox-down-at-x') && event.screenY === options.data('selectBox-down-at-y')) {
								options.removeData('selectBox-down-at-x').removeData('selectBox-down-at-y');
								hideMenus();
							}
						}).bind('mouseup.selectBox', function(event) {
							if (event.screenX === options.data('selectBox-down-at-x') && event.screenY === options.data('selectBox-down-at-y')) {
								return;
							} else {
								options.removeData('selectBox-down-at-x').removeData('selectBox-down-at-y');
							}
							selectOption(select, $(this).parent());
							hideMenus();
						}).bind('mouseover.selectBox', function(event) {
							addHover(select, $(this).parent());
						}).bind('mouseout.selectBox', function(event) {
							removeHover(select, $(this).parent());
						});
						// Inherit classes for dropdown menu
						var classes = select.attr('class') || '';
						if (classes !== '') {
							classes = classes.split(' ');
							for (var i in classes) options.addClass(classes[i] + '-selectBox-dropdown-menu');
						}
						disableSelection(options);
						return options;
					}
				};
			var getLabelClass = function(select) {
					var selected = $(select).find('OPTION:selected');
					return ('selectBox-label ' + (selected.attr('class') || '')).replace(/\s+$/, '');
				};
			var getLabelText = function(select) {
					var selected = $(select).find('OPTION:selected');
					return selected.text() || '\u00A0';
				};
			var setLabel = function(select) {
					select = $(select);
					var control = select.data('selectBox-control');
					if (!control) return;
					control.find('.selectBox-label').attr('class', getLabelClass(select)).text(getLabelText(select));
				};
			var destroy = function(select) {
					select = $(select);
					var control = select.data('selectBox-control');
					if (!control) return;
					var options = control.data('selectBox-options');
					options.remove();
					control.remove();
					select.removeClass('selectBox').removeData('selectBox-control').data('selectBox-control', null).removeData('selectBox-settings').data('selectBox-settings', null).show();
				};
			var refresh = function(select) {
					select = $(select);
					select.selectBox('options', select.html());
				};
			var showMenu = function(select) {
					select = $(select);
					var control = select.data('selectBox-control'),
						settings = select.data('selectBox-settings'),
						options = control.data('selectBox-options');
					if (control.hasClass('selectBox-disabled')) return false;
					hideMenus();
					var borderBottomWidth = isNaN(control.css('borderBottomWidth')) ? 0 : parseInt(control.css('borderBottomWidth'));
					// Menu position
					options.width(control.innerWidth()).css({
						top: control.offset().top + control.outerHeight() - borderBottomWidth,
						left: control.offset().left
					});
					if (select.triggerHandler('beforeopen')) return false;
					var dispatchOpenEvent = function() {
							select.triggerHandler('open', {
								_selectBox: true
							});
						};
					// Show menu
					switch (settings.menuTransition) {
					case 'fade':
						options.fadeIn(settings.menuSpeed, dispatchOpenEvent);
						break;
					case 'slide':
						options.slideDown(settings.menuSpeed, dispatchOpenEvent);
						break;
					default:
						options.show(settings.menuSpeed, dispatchOpenEvent);
						break;
					}
					if (!settings.menuSpeed) dispatchOpenEvent();
					// Center on selected option
					var li = options.find('.selectBox-selected:first');
					keepOptionInView(select, li, true);
					addHover(select, li);
					control.addClass('selectBox-menuShowing');
					$(document).bind('mousedown.selectBox', function(event) {
						if ($(event.target).parents().andSelf().hasClass('selectBox-options')) return;
						hideMenus();
					});
				};
			var hideMenus = function() {
					if ($(".selectBox-dropdown-menu:visible").length === 0) return;
					$(document).unbind('mousedown.selectBox');
					$(".selectBox-dropdown-menu").each(function() {
						var options = $(this),
							select = options.data('selectBox-select'),
							control = select.data('selectBox-control'),
							settings = select.data('selectBox-settings');
						if (select.triggerHandler('beforeclose')) return false;
						var dispatchCloseEvent = function() {
								select.triggerHandler('close', {
									_selectBox: true
								});
							};
						if (settings) {
							switch (settings.menuTransition) {
							case 'fade':
								options.fadeOut(settings.menuSpeed, dispatchCloseEvent);
								break;
							case 'slide':
								options.slideUp(settings.menuSpeed, dispatchCloseEvent);
								break;
							default:
								options.hide(settings.menuSpeed, dispatchCloseEvent);
								break;
							}
							if (!settings.menuSpeed) dispatchCloseEvent();
							control.removeClass('selectBox-menuShowing');
						} else {
							$(this).hide();
							$(this).triggerHandler('close', {
								_selectBox: true
							});
							$(this).removeClass('selectBox-menuShowing');
						}
					});
				};
			var selectOption = function(select, li, event) {
					select = $(select);
					li = $(li);
					var control = select.data('selectBox-control'),
						settings = select.data('selectBox-settings');
					if (control.hasClass('selectBox-disabled')) return false;
					if (li.length === 0 || li.hasClass('selectBox-disabled')) return false;
					if (select.attr('multiple')) {
						// If event.shiftKey is true, this will select all options between li and the last li selected
						if (event.shiftKey && control.data('selectBox-last-selected')) {
							li.toggleClass('selectBox-selected');
							var affectedOptions;
							if (li.index() > control.data('selectBox-last-selected').index()) {
								affectedOptions = li.siblings().slice(control.data('selectBox-last-selected').index(), li.index());
							} else {
								affectedOptions = li.siblings().slice(li.index(), control.data('selectBox-last-selected').index());
							}
							affectedOptions = affectedOptions.not('.selectBox-optgroup, .selectBox-disabled');
							if (li.hasClass('selectBox-selected')) {
								affectedOptions.addClass('selectBox-selected');
							} else {
								affectedOptions.removeClass('selectBox-selected');
							}
						} else if ((isMac && event.metaKey) || (!isMac && event.ctrlKey)) {
							li.toggleClass('selectBox-selected');
						} else {
							li.siblings().removeClass('selectBox-selected');
							li.addClass('selectBox-selected');
						}
					} else {
						li.siblings().removeClass('selectBox-selected');
						li.addClass('selectBox-selected');
					}
					if (control.hasClass('selectBox-dropdown')) {
						control.find('.selectBox-label').text(li.text());
					}
					// Update original control's value
					var i = 0,
						selection = [];
					if (select.attr('multiple')) {
						control.find('.selectBox-selected A').each(function() {
							selection[i++] = $(this).attr('rel');
						});
					} else {
						selection = li.find('A').attr('rel');
					}
					// Remember most recently selected item
					control.data('selectBox-last-selected', li);
					// Change callback
					if (select.val() !== selection) {
						select.val(selection);
						setLabel(select);
						select.trigger('change');
					}
					return true;
				};
			var addHover = function(select, li) {
					select = $(select);
					li = $(li);
					var control = select.data('selectBox-control'),
						options = control.data('selectBox-options');
					options.find('.selectBox-hover').removeClass('selectBox-hover');
					li.addClass('selectBox-hover');
				};
			var removeHover = function(select, li) {
					select = $(select);
					li = $(li);
					var control = select.data('selectBox-control'),
						options = control.data('selectBox-options');
					options.find('.selectBox-hover').removeClass('selectBox-hover');
				};
			var keepOptionInView = function(select, li, center) {
					if (!li || li.length === 0) return;
					select = $(select);
					var control = select.data('selectBox-control'),
						options = control.data('selectBox-options'),
						scrollBox = control.hasClass('selectBox-dropdown') ? options : options.parent(),
						top = parseInt(li.offset().top - scrollBox.position().top),
						bottom = parseInt(top + li.outerHeight());
					if (center) {
						scrollBox.scrollTop(li.offset().top - scrollBox.offset().top + scrollBox.scrollTop() - (scrollBox.height() / 2));
					} else {
						if (top < 0) {
							scrollBox.scrollTop(li.offset().top - scrollBox.offset().top + scrollBox.scrollTop());
						}
						if (bottom > scrollBox.height()) {
							scrollBox.scrollTop((li.offset().top + li.outerHeight()) - scrollBox.offset().top + scrollBox.scrollTop() - scrollBox.height());
						}
					}
				};
			var handleKeyDown = function(select, event) {
					//
					// Handles open/close and arrow key functionality
					//
					select = $(select);
					var control = select.data('selectBox-control'),
						options = control.data('selectBox-options'),
						settings = select.data('selectBox-settings'),
						totalOptions = 0,
						i = 0;
					if (control.hasClass('selectBox-disabled')) return;
					switch (event.keyCode) {
					case 8:
						// backspace
						event.preventDefault();
						typeSearch = '';
						break;
					case 9:
						// tab
					case 27:
						// esc
						hideMenus();
						removeHover(select);
						break;
					case 13:
						// enter
						if (control.hasClass('selectBox-menuShowing')) {
							selectOption(select, options.find('LI.selectBox-hover:first'), event);
							if (control.hasClass('selectBox-dropdown')) hideMenus();
						} else {
							showMenu(select);
						}
						break;
					case 38:
						// up
					case 37:
						// left
						event.preventDefault();
						if (control.hasClass('selectBox-menuShowing')) {
							var prev = options.find('.selectBox-hover').prev('LI');
							totalOptions = options.find('LI:not(.selectBox-optgroup)').length;
							i = 0;
							while (prev.length === 0 || prev.hasClass('selectBox-disabled') || prev.hasClass('selectBox-optgroup')) {
								prev = prev.prev('LI');
								if (prev.length === 0) {
									if (settings.loopOptions) {
										prev = options.find('LI:last');
									} else {
										prev = options.find('LI:first');
									}
								}
								if (++i >= totalOptions) break;
							}
							addHover(select, prev);
							selectOption(select, prev, event);
							keepOptionInView(select, prev);
						} else {
							showMenu(select);
						}
						break;
					case 40:
						// down
					case 39:
						// right
						event.preventDefault();
						if (control.hasClass('selectBox-menuShowing')) {
							var next = options.find('.selectBox-hover').next('LI');
							totalOptions = options.find('LI:not(.selectBox-optgroup)').length;
							i = 0;
							while (next.length === 0 || next.hasClass('selectBox-disabled') || next.hasClass('selectBox-optgroup')) {
								next = next.next('LI');
								if (next.length === 0) {
									if (settings.loopOptions) {
										next = options.find('LI:first');
									} else {
										next = options.find('LI:last');
									}
								}
								if (++i >= totalOptions) break;
							}
							addHover(select, next);
							selectOption(select, next, event);
							keepOptionInView(select, next);
						} else {
							showMenu(select);
						}
						break;
					}
				};
			var handleKeyPress = function(select, event) {
					//
					// Handles type-to-find functionality
					//
					select = $(select);
					var control = select.data('selectBox-control'),
						options = control.data('selectBox-options');
					if (control.hasClass('selectBox-disabled')) return;
					switch (event.keyCode) {
					case 9:
						// tab
					case 27:
						// esc
					case 13:
						// enter
					case 38:
						// up
					case 37:
						// left
					case 40:
						// down
					case 39:
						// right
						// Don't interfere with the keydown event!
						break;
					default:
						// Type to find
						if (!control.hasClass('selectBox-menuShowing')) showMenu(select);
						event.preventDefault();
						clearTimeout(typeTimer);
						typeSearch += String.fromCharCode(event.charCode || event.keyCode);
						options.find('A').each(function() {
							if ($(this).text().substr(0, typeSearch.length).toLowerCase() === typeSearch.toLowerCase()) {
								addHover(select, $(this).parent());
								keepOptionInView(select, $(this).parent());
								return false;
							}
						});
						// Clear after a brief pause
						typeTimer = setTimeout(function() {
							typeSearch = '';
						}, 1000);
						break;
					}
				};
			var enable = function(select) {
					select = $(select);
					select.attr('disabled', false);
					var control = select.data('selectBox-control');
					if (!control) return;
					control.removeClass('selectBox-disabled');
				};
			var disable = function(select) {
					select = $(select);
					select.attr('disabled', true);
					var control = select.data('selectBox-control');
					if (!control) return;
					control.addClass('selectBox-disabled');
				};
			var setValue = function(select, value) {
					select = $(select);
					select.val(value);
					value = select.val(); // IE9's select would be null if it was set with a non-exist options value
					if (value === null) { // So check it here and set it with the first option's value if possible
						value = select.children().first().val();
						select.val(value);
					}
					var control = select.data('selectBox-control');
					if (!control) return;
					var settings = select.data('selectBox-settings'),
						options = control.data('selectBox-options');
					// Update label
					setLabel(select);
					// Update control values
					options.find('.selectBox-selected').removeClass('selectBox-selected');
					options.find('A').each(function() {
						if (typeof(value) === 'object') {
							for (var i = 0; i < value.length; i++) {
								if ($(this).attr('rel') == value[i]) {
									$(this).parent().addClass('selectBox-selected');
								}
							}
						} else {
							if ($(this).attr('rel') == value) {
								$(this).parent().addClass('selectBox-selected');
							}
						}
					});
					if (settings.change) settings.change.call(select);
				};
			var setOptions = function(select, options) {
					select = $(select);
					var control = select.data('selectBox-control'),
						settings = select.data('selectBox-settings');
					switch (typeof(data)) {
					case 'string':
						select.html(data);
						break;
					case 'object':
						select.html('');
						for (var i in data) {
							if (data[i] === null) continue;
							if (typeof(data[i]) === 'object') {
								var optgroup = $('<optgroup label="' + i + '" />');
								for (var j in data[i]) {
									optgroup.append('<option value="' + j + '">' + data[i][j] + '</option>');
								}
								select.append(optgroup);
							} else {
								var option = $('<option value="' + i + '">' + data[i] + '</option>');
								select.append(option);
							}
						}
						break;
					}
					if (!control) return;
					// Remove old options
					control.data('selectBox-options').remove();
					// Generate new options
					var type = control.hasClass('selectBox-dropdown') ? 'dropdown' : 'inline';
					options = getOptions(select, type);
					control.data('selectBox-options', options);
					switch (type) {
					case 'inline':
						control.append(options);
						break;
					case 'dropdown':
						// Update label
						setLabel(select);
						$("BODY").append(options);
						break;
					}
				};
			var disableSelection = function(selector) {
					$(selector).css('MozUserSelect', 'none').bind('selectstart', function(event) {
						event.preventDefault();
					});
				};
			var generateOptions = function(self, options) {
					var li = $('<li />'),
						a = $('<a />');
					li.addClass(self.attr('class'));
					li.data(self.data());
					a.attr('rel', self.val()).text(self.text());
					li.append(a);
					if (self.attr('disabled')) li.addClass('selectBox-disabled');
					if (self.attr('selected')) li.addClass('selectBox-selected');
					options.append(li);
				};
			//
			// Public methods
			//
			switch (method) {
			case 'control':
				return $(this).data('selectBox-control');
			case 'settings':
				if (!data) return $(this).data('selectBox-settings');
				$(this).each(function() {
					$(this).data('selectBox-settings', $.extend(true, $(this).data('selectBox-settings'), data));
				});
				break;
			case 'options':
				// Getter
				if (data === undefined) return $(this).data('selectBox-control').data('selectBox-options');
				// Setter
				$(this).each(function() {
					setOptions(this, data);
				});
				break;
			case 'value':
				// Empty string is a valid value
				if (data === undefined) return $(this).val();
				$(this).each(function() {
					setValue(this, data);
				});
				break;
			case 'refresh':
				$(this).each(function() {
					refresh(this);
				});
				break;
			case 'enable':
				$(this).each(function() {
					enable(this);
				});
				break;
			case 'disable':
				$(this).each(function() {
					disable(this);
				});
				break;
			case 'destroy':
				$(this).each(function() {
					destroy(this);
				});
				break;
			default:
				$(this).each(function() {
					init(this, method);
				});
				break;
			}
			return $(this);
		}
	});
})(jQuery);
/*
 * rfc3339date.js version 0.1.3
 *
 * Adds ISO 8601 / RFC 3339 date parsing to the Javascript Date object.
 * Usage:
 *   var d = Date.parseISO8601( "2010-07-20T15:00:00Z" );
 *   var d = Date.parse( "2010-07-20T15:00:00Z" );
 * Tested for compatibilty/coexistence with:
 *   - jQuery [http://jquery.com]
 *   - datejs [http://www.datejs.com/]
 *
 * Copyright (c) 2010 Paul GALLAGHER http://tardate.com
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */

/*
 * Number.prototype.toPaddedString
 * Number instance method used to left-pad numbers to the specified length
 * Used by the Date.prototype.toRFC3339XXX methods
 */
Number.prototype.toPaddedString = function(len , fillchar) {
  var result = this.toString();
  if(typeof(fillchar) == 'undefined'){ fillchar = '0' };
  while(result.length < len){ result = fillchar + result; };
  return result;
}

/*
 * Date.prototype.toRFC3339UTCString
 * Date instance method to format the date as ISO8601 / RFC 3339 string (in UTC format).
 * Usage: var d = new Date().toRFC3339UTCString();
 *              => "2010-07-25T11:51:31.427Z"
 * Parameters:
 *  supressFormating : if supplied and 'true', will force to remove date/time separators
 *  supressMillis : if supplied and 'true', will force not to include milliseconds
 */
Date.prototype.toRFC3339UTCString = function(supressFormating , supressMillis){
  var dSep = ( supressFormating ? '' : '-' );
  var tSep = ( supressFormating ? '' : ':' );
  var result = this.getUTCFullYear().toString();
  result += dSep + (this.getUTCMonth() + 1).toPaddedString(2);
  result += dSep + this.getUTCDate().toPaddedString(2);
  result += 'T' + this.getUTCHours().toPaddedString(2);
  result += tSep + this.getUTCMinutes().toPaddedString(2);
  result += tSep + this.getUTCSeconds().toPaddedString(2);
  if((!supressMillis)&&(this.getUTCMilliseconds()>0)) result += '.' + this.getUTCMilliseconds().toPaddedString(3);
  return result + 'Z';
}

/*
 * Date.prototype.toRFC3339LocaleString
 * Date instance method to format the date as ISO8601 / RFC 3339 string (in local timezone format).
 * Usage: var d = new Date().toRFC3339LocaleString();
 *              => "2010-07-25T19:51:31.427+08:00"
 * Parameters:
 *  supressFormating : if supplied and 'true', will force to remove date/time separators
 *  supressMillis : if supplied and 'true', will force not to include milliseconds
 */
Date.prototype.toRFC3339LocaleString = function(supressFormating , supressMillis){
  var dSep = ( supressFormating ? '' : '-' );
  var tSep = ( supressFormating ? '' : ':' );
  var result = this.getFullYear().toString();
  result += dSep + (this.getMonth() + 1).toPaddedString(2);
  result += dSep + this.getDate().toPaddedString(2);
  result += 'T' + this.getHours().toPaddedString(2);
  result += tSep + this.getMinutes().toPaddedString(2);
  result += tSep + this.getSeconds().toPaddedString(2);
  if((!supressMillis)&&(this.getMilliseconds()>0)) result += '.' + this.getMilliseconds().toPaddedString(3);
  var tzOffset = -this.getTimezoneOffset();
  result += ( tzOffset<0 ? '-' : '+' )
  result += (tzOffset/60).toPaddedString(2);
  result += tSep + (tzOffset%60).toPaddedString(2);
  return result;
}

/*
 * Date.parseRFC3339
 * extend Date with a method parsing ISO8601 / RFC 3339 date strings.
 * Usage: var d = Date.parseRFC3339( "2010-07-20T15:00:00Z" );
 */
Date.parseRFC3339 = function(dString){
  if (typeof dString != 'string') return;
  var result;
  var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)?(:)?(\d\d)?([\.,]\d+)?($|Z|([+-])(\d\d)(:)?(\d\d)?)/i;
  var d = dString.match(new RegExp(regexp));
  if (d) {
    var year = parseInt(d[1],10);
    var mon = parseInt(d[3],10) - 1;
    var day = parseInt(d[5],10);
    var hour = parseInt(d[7],10);
    var mins = ( d[9] ? parseInt(d[9],10) : 0 );
    var secs = ( d[11] ? parseInt(d[11],10) : 0 );
    var millis = ( d[12] ? parseFloat(String(1.5).charAt(1) + d[12].slice(1)) * 1000 : 0 );
    if (d[13]) {
      result = new Date(0);
      result.setUTCFullYear(year);
      result.setUTCMonth(mon);
      result.setUTCDate(day);
      result.setUTCHours(hour);
      result.setUTCMinutes(mins);
      result.setUTCSeconds(secs);
      result.setUTCMilliseconds(millis);
      if (d[13] && d[14]) {
        var offset = (d[15] * 60)
        if (d[17]) offset += parseInt(d[17],10);
        offset *= ((d[14] == '-') ? -1 : 1);
        result.setTime(result.getTime() - offset * 60 * 1000);
      }
    } else {
      result = new Date(year,mon,day,hour,mins,secs,millis);
    }
  }
  return result;
};

/*
 * Date.parse
 * extend Date with a parse method alias for parseRFC3339.
 * If parse is already defined, chain methods to include parseRFC3339
 * Usage: var d = Date.parse( "2010-07-20T15:00:00Z" );
 */
if (typeof Date.parse != 'function') {
  Date.parse = Date.parseRFC3339;
} else {
  var oldparse = Date.parse;
  Date.parse = function(d) {
    var result = Date.parseRFC3339(d);
    if (!result && oldparse) {
      result = oldparse(d);
    }
    return result;
  }
}
/*! 
* GE Base
* part of the GE UI Kit
* Sets up the GE namespace, and global helper functions
*
*/

// Shim to get CDN loaded jQuery defined
define('jQuery', [], function () {
    return jQuery;
});

define( 'geui/base', ['jQuery', 'lodash'], function ( $, _ ) {

    var geui = {};

    geui.cfg = {
        'readyQueue': []
    };

    geui.opts = {
        'debug': false
    };

    geui.modules = {};

    geui.evt = {
        'ready': function( e ) {
            // execute the ready queue
            _.each( geui.cfg.readyQueue, function( callback ) {
                callback( geui.cfg );
            } );
            geui.cfg.ready = true;
        }
    };

    geui.publicFn = {
        'init': function( options) {
            // Setup our configuration - options overwrites geui.opts, and geui.cfg overwrites them all. 
            _.extend( geui.cfg, geui.opts, options, geui.cfg );
            // bind our ready event
            $( document )
                .ready( geui.evt.ready );
        },
        'registerModule': function( module ) {
            // store a reference to this module in our global 
            geui.modules[module.name] = module['publicFn'];
            // ensure this module is initialized as soon as the dom is ready 
            if ( !! module.autoinit ) {
                geui.privateFn.ready( geui.modules[module.name].init );
            }
            
            // expose the modules public functions
            geui.publicFn[module.name] = geui.modules[module.name];
        },
        /*
         * Provides a method for requesting data, either from localstorage or the provided URL
         *
         * @method withData
         * @param {Object} cfg The configuration details. Must include data or a URL
         * @param {Function} callback The function to hand the data off to once we have it
         *
         */
        'withData': function( cfg, callback ) {
            var dataItem,
                now = (new Date()).getTime(),
                expires = typeof(cfg.expires) != 'undefined' ? now + cfg.expires : 99999999999999999999,
                data;
            if ( typeof( localStorage ) != 'undefined' ) {
                // use localStorage if it exists
                // check if our data is already cached
                dataItem =  JSON.parse( localStorage.getItem( cfg.url ) );
                if ( dataItem && now < dataItem.expiresAt ) {
                    // use our existing data
                    callback( dataItem.data );
                } else {
                    // request new data
                    $.getJSON( 
                        cfg.url,
                        function( data ) {
                            // run our callback with the new data
                            callback( data );
                            // store the data for later
                            data = JSON.stringify( {
                                'expiresAt': expires,
                                'data': data
                            } );
                            localStorage.setItem( cfg.url, data );
                        } );
                }
            }
        }
    };

    geui.privateFn = {
        'ready': function( callback ) {
            if ( geui.cfg.ready ) {
                callback( geui.cfg );
            } else {
                geui.cfg.readyQueue.push( callback );
            }
        }
    };

    return geui.publicFn;

});

// expose geui as a global and get things started
require(['geui/base'], function( geui ) {
    window.geui = geui;
});

/*! 
* GE Track
* part of the GE UI Kit
* Interface and helper functions for communicating with Google Analytics
*
*/

define( 'geui/track', ['geui/base', 'jQuery'], function ( geui, $ ) {

    // namespace object to help organize our code
    var track = {};

    // required for geui module compatabillity. 
    track.name = "track";
    track.autoinit = true;

    // Non configurables
    track.cfg = {
        'category': '',
        'debug': false,
        'trackingEnabled': true,
        'regex': {
            'external': /^(http|ftp|https)?:\/\//,
            'internal': /^(?!#|http|https|ftp|:\/\/).*/,
            'mailto': /^mailto:(.*)/
        }
    };
    
    // Default user options
    track.opts = {};

    track.publicFn = {
        'init': function( options ) {
            _.extend( track.cfg, track.opts, options, track.cfg );
            track.privateFn.setBaseCategory();
            track.privateFn.bindEvents();
        },
        /* 
         * Dumps all click tracked elements and events to the console for testing purposes. 
         *
         * @method deubg
         *
         */
        'debug': function() {
            // stash _gaq temporarily
            var oldGAQ = _gaq;
            // swap it for a basic array
            _gaq = [];
            // trigger all our click events
            $( 'a' ).trigger( 'click.ge.track', [{ 'debug': true }] );
            // trigger all form submissions
            $( 'form' )
                .bind( 'submit.temp', function( e ) {
                    e.preventDefault();
                } )
                .trigger( 'submit', [{ 'debug': true }] )
                .unbind( 'submit.temp' );

            // bind video tracking events
            // $( 'body' ).on( 'play.ytVideo', '.yt-video', track.evt.videoPlay );
            // $( 'body' ).on( 'playback.ytVideo', '.yt-video', track.evt.videoPlayback );

            // dump each tracking request as a CSV
            console.info( 'Click & Form tracking on ' + window.location.href );
            console.log( _gaq.join( '\n' ) );
            // restore _gaq
            _gaq = oldGAQ;
            //clear out the temporary pointer
            delete oldGAQ;
        },
        /*
         * Provides a wrapper for tracking events with google analytics. 
         * 
         * @method trackEvent 
         * @param category string The name of the category being tacked. Google Analytics specific value.
         * @param action string The name of the action being tacked. Google Analytics specific value.
         * @param label string The label to give the tracking event. Google Analytics specific value.
         */
        'trackEvent': function( category, action, label ) {
            var args = ['_trackEvent', category, action, label];
            if ( track.cfg.debug ) {
                console.log( "TrackEvent:", args );
            }
            if ( track.cfg.trackingEnabled ) {
                _gaq
                    .push( args );
            }
        }
    };

    track.evt = {
        /* 
         * Click event handler
         *
         * @method click
         * @param {Event} e The event object
         */
        'click': function( e ) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = track.privateFn.getClickAction( $this ),
                label = track.privateFn.getClickLabel( $this );
            // don't do a thing if this has a notrack attribute
            if ( $this.not( '[data-ga-notrack]' ).length > 0 ) {
                track.publicFn.trackEvent( category, action, label );
            }
        },
        /* 
         * Submit event handler
         *
         * @method submit
         * @param {Event} e The event object
         */
        'submit': function( e ) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = 'Form Submit',
                label = '';
            // don't do a thing if this has a notrack attribute
            if ( $this.not( '[data-ga-notrack]' ).length > 0 ) {
                track.publicFn.trackEvent( category, action, label );
            }
        },
        /* 
         * Video play event handler.
         *
         * @method videoPlay
         * @param {Event} e The event object
         * @param {Object} context The yt-video context object
         */
        'videoPlay': function( e, context ) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = 'Playback - ',
                label = '',
                videoID = context.player.getVideoUrl().match(/v=([^&]*)/)[1];
            if ( ! context.playTracked ) {
                // only track one play per video per page load
                context.playTracked = true;
                track.publicFn.trackEvent( category, 'Video Play', videoID );
            }
        },
        /* 
         * Video playback event handler - tracks playback progression.
         *
         * @method videoPlay
         * @param {Event} e The event object
         * @param {Object} context The yt-video context object
         */
        'videoPlayback': function( e, context) {
            var $this = $( this ),
                category = track.privateFn.getCategory( $this ),
                action = 'Video Playback - ',
                label = '',
                t = context.player.getCurrentTime(),
                videoID = context.player.getVideoUrl().match(/v=([^&]*)/)[1];
            if ( typeof( context.duration ) === 'undefined' || context.duration <= 0 ) {
                context.duration = context.player.getDuration();
                context.progress = 0;
            } else {
                if ( context.progress < Math.ceil( ( t / context.duration ) * 10 ) ) {
                    context.progress = Math.ceil( ( t / context.duration ) * 10 );
                    track.publicFn.trackEvent( category, action + context.progress + '0', videoID );            
                }
            }
        }
    };


    track.privateFn = {
        /* 
         * All automatic event bindings are done here. We bind events to the following things:
         *  - Click events on a tags that do not have a data-ga-notrack attribute.
         *
         * @method bindEvents
         *
         */
        'bindEvents': function() {
            // bind tracking evnets to all links
            $( 'body' ).on( 'click.ge.track', 'a', track.evt.click );
            // bind tracking events to all form submits
            $( 'body' ).on( 'submit.ge.track', 'form', track.evt.submit );
            // bind video tracking events
            $( 'body' ).on( 'play.ytVideo', '.yt-video', track.evt.videoPlay );
            $( 'body' ).on( 'playback.ytVideo', '.yt-video', track.evt.videoPlayback );
        },
        /* 
         * This method sets the base category variable based on the current page title
         *
         * @method setBaseCategory
         */
        'setBaseCategory': function() {
            track.cfg.category = $( 'title' ).text();
        },
        /* 
         * A method to determine the most appropriate category for a tracking event
         * Using the base category as our default, we then start with the element that 
         * triggered the event, and traverse up the DOM, looking for either an id or a data-ga-category
         * attribute to append to our base category and make our category more specific.
         *
         * @method getCategory
         * @param {Object} $ele jQuery object containing the element that triggered the event
         * @return {String} The category to be used in the trackEvent call
         */
        'getCategory': function( $ele ) {
            // start with the base category
            var category = track.cfg.category,
                // look for a more specific label that we can add
                // either a data-ga-category or an id attribute, whichever comes first
                $specifier = $ele.closest( '[data-ga-category],[id]' );

            if ( $specifier.size() > 0 ) {
                // if we have a specifier, append the attribute to our base category
                if ( $specifier.is('[data-ga-category]' ) ) {
                    category += ' - ' + $specifier.data( 'ga-category' );
                } else if ( $specifier.is( '[id]' ) ) {
                    category += ' - ' + $specifier.attr( 'id' );
                }
            }
            return category;
        },
        /* 
         * A method to determine the most appropriate action for tracking a click event
         * We check for the following, in order:
         *  - data action attribute
         *  - external link
         *  - internal link
         * 
         * Example Actions:
         * Action parameter: video Name, Images, Inbound links, 
         * OutBound links, Forms, Downloads, Flash Games, Social Plugins etc 
         *
         * @method getClickAction
         * @param {Object} $ele jQuery object containing the element that triggered the event
         * @return {String} The action to be used in the trackEvent call
         */
        'getClickAction': function( $ele ) {
            var action = 'Click - Generic Link',
                href = $ele.attr( 'href' ),
                ext = ( href && href.length ) > 0 ? href.match(/[^\s]+(\.(pdf|zip|rar|txt|doc|docx|xcl))$/) : null,
                $specifier = $ele.closest( '[data-ga-action]' );
            // look for a ga-action attribute
            if ( $specifier.length > 0 ) {
                // has a specified action label
                action = $specifier.data( 'ga-action' );
            } else if ( ext && ext.length > 1 ) {
                label = "Click - Download ." + ext[1];
            } else if ( href && href.match( track.cfg.regex.mailto ) ) {
                action = "Click - Mailto Link";
            } else if ( href && href.match( track.cfg.regex.external ) ) {
                // matches our external link regex
                action = 'Click - Outbound Link';
            } else if ( href && href.match( track.cfg.regex.internal ) ) {
                action = 'Click - Inbound Link';
            }
            return action;
        },
        /* 
         * A method to determine the most appropriate label for tracking a click event.
         * Starting with the element's text as a default, we check for the following, in order:
         *  - data-ga-label attribute
         *  - href attribute
         *
         * Feedback:
         * video completion percentages, Facebook Likes, Tweet Share, Pin in on Pinterest,  
         * Name of PDF downloaded, name of image, inbound & outbound text links or buttons etc
         *
         * @method getClickLabel
         * @param {Object} $ele jQuery object containing the element that triggered the event
         * @return {String} The label to be used in the trackEvent call
         */
        'getClickLabel': function( $ele ) {
            // use the link text as the base label
            var label = $ele.text().replace(/\s+/g, " "),
                href = $ele.attr( 'href' ),
                title = $ele.attr( 'title' ),
                custom = $ele.attr( 'data-ga-label' );
            if (  custom && custom.length > 0 ) {
                // if we have a data-ga-label attribute, use that 
                label = custom;
            } else if ( $ele.closest( '.hnav' ).length > 0 ) {
                // check for conditions where we want to stick with the default
                return label;
            } else if ( href && href.match( track.cfg.regex.mailto ) ) {
                // check for mailto links
                label = href.match( track.cfg.regex.mailto )[1];
            } else if( title && title.length > 0 ) {
                label = title;
            } else if ( href && href.match(/^(?!\#).+/) ) {
                // if the href attribuet is not blank and doesn't start with a hash, use that as the label
                label = href;
            }
            return label;
        }
    };

    geui.registerModule( track );

    return track.publicFn;

} );
/*! 
* GE Tools
* part of the GE UI Kit
* General helper functions for developers. Currently contains mostly code qualtiy tools.
*
*/

define( 'geui/tools', ['geui/base', 'jQuery'], function ( geui, $ ) {

    // namespace object to help organize our code
    var tools = {};

    // required for geui module compatabillity. 
    tools.name = "tools";

    // Non configurables
    tools.cfg = {
        'debug': false
    };
    
    // Default user options
    tools.opts = {};

    tools.publicFn = {
        'init': function( opts ) {
            tools.cfg.debug = opts.debug;
        },
        /* 
         * Runs our code linting functions.
         *
         * @method lint
         *
         */
        'lint': function() {
        	tools.privateFn.multipleIDCheck();
        	tools.privateFn.headingChecks();
        }
    };

    tools.evt = {};


    tools.privateFn = {
    	/* 
    	 * Checks for multiple instances of an id on the current page
    	 *
    	 * @method multiplIDCheck
    	 *
    	 */
        'multipleIDCheck': function() {
        	$( '[id]' ).each( function() {
        	  var ids = $( '[id="'+this.id+'"]' );
        	  if( ids.length > 1 && ids[0] == this )
        	    console.warn( 'Multiple IDs #' + this.id );
        	} );
        },
        /* 
    	 * Runs a few heading tag checks:
    	 *  - one and only one h1 tag
    	 *
    	 * @method headingChecks
    	 *
    	 */
        'headingChecks': function() {
        	var h1Count = $( 'h1' ).length;
        	// ensure that we have one and only one h1
        	if ( h1Count > 1 ) {
        		console.warn( 'More than one h1 tag.' );
        	} else if ( h1Count === 0) {
        		console.warn( 'Missing h1 tag.' );
        	}
        },
    };

    geui.registerModule( tools );

    return tools.publicFn;

} );

/*! 
* GE Video
* part of the GE UI Kit
* Handles rendering youtube and brightcove videos.
*
*/

define( 'geui/video', ['geui/track', 'jQuery', 'lodash'], function ( geuiTrack, $, _ ) {

	// Define an object to hold our code
	var video = {};

	// Compatability for geui
	video.name = "video";
	video.autoinit = false;

	// Define configuration settings.
	// These should not be able to be overriden outside of this code
	video.cfg = {
		'fallbackCountries': ['china', 'iran', 'libya', 'turkmenistan'],
		'youtubeSupport': true,
		'brigthcoveTmpl': '<object id="myExperience-{ID}" class="BrightcoveExperience">' +
							'<param name="bgcolor" value="#FFFFFF" />' +
							'<param name="wmode" value="transparent" />' +
							'<param name="playerID" value="1213033043001" />' +
							'<param name="playerKey" value="AQ~~,AAAAAH8oK3k~,_eXHhjsNJU970nDNAkJUiQ60EtECXxa8" />' +
							'<param name="isVid" value="true" />' +
							'<param name="isUI" value="true" />' +
							'<param name="dynamicStreaming" value="true" />' +
							'<param name="@videoPlayer" value="{ID}" />' +
						'</object>'
	};

	// Define options
	// These should be able to be overriden outside of this code
	video.opts = {
		'countryName': 'United States'
	};

	// Define event handlers
	video.evt = {
		'ready': function() {
			video.privateFn.regionPlayerPatch();
		}
	}
	// Define protected functions
	// These are only for internal use, and are not exposed
	video.privateFn = {
		// Called when the jobs data is recieved and we should know what country our user is in
		'setYoutubeSupport': function( ) {
			var country = video.cfg.countryName,
				// look for the country query string parameter
				param = unescape( window.location.search ).match( /country\=([a-zA-Z0-9\s]+)/ );
			// if the user has passed the country through the query string, try to respect it
			if ( param ) {
				country = param[1];
			} 
			if ( country ) {
				if ( video.cfg.fallbackCountries.indexOf( country.toLowerCase() ) != -1 ) {
					video.cfg.youtubeSupport = false;
				} else {
					video.cfg.youtubeSupport = true;
				}
			} else {
				video.cfg.youtubeSupport = true;
			}
		},
		'renderVideos': function() {
			if ( video.cfg.youtubeSupport ) {
				$( '.geui-video[data-video-yt]' ).ytVideo();
			} else {
				// render brightcove players for all!
				$( '.geui-video[data-video-bc]' ).each( function() {
					var $container = $( this ),
						$player = $( video.cfg.brigthcoveTmpl
								.replace( /\{ID\}/gm, $container.data( 'video-bc' ) ) ),
						ratio = (900/16);
					// if both the width and height attribuets are present, 
					// calculate and apply our aspect ratio
					if ( $container.is( '[data-video-width]' ) && $container.is( '[data-video-height]' ) ) {
						ratio = ( $container.data( 'video-height' ) / $container.data( 'video-width') ) * 100;
						$container.css( 'padding-bottom', ratio + "%")
					}
					$container.append( $player ); 
				} );
				brightcove.createExperiences();
			}
		}
	};

	// Define public functions

	video.publicFn = {
		'init': function( options ) {
			// Setup our configuration - options overwrites video.opts, and video.cfg overwrites them all. 
            _.extend( video.cfg, video.opts, options, video.cfg );
			video.privateFn.setYoutubeSupport();
			$( '.geui-video' ).each( function( n, ele ) {
				video.publicFn.render( $( ele ) );
			})
			// video.privateFn.renderVideos();
		},
		'render': function( $ele ) {
			var $container = $ele,
				$player;
			if ( video.cfg.youtubeSupport && $ele.is( '[data-video-yt]' ) ) {
				$player = $( '<div clas="yt-video"></div>' )
					.attr( 'data-yt-ref', $ele.data( 'video-yt' ) );
				$container.append( $player );
				$player.ytVideo();
			} else if ( $ele.is( '[data-video-bc]' ) ) {
				// render brightcove players for all!
				var $container = $ele,
					$player = $( video.cfg.brigthcoveTmpl
							.replace( /\{ID\}/gm, $container.data( 'video-bc' ) ) ),
					ratio = (900/16);
				// if both the width and height attribuets are present, 
				// calculate and apply our aspect ratio
				if ( $container.is( '[data-video-width]' ) && $container.is( '[data-video-height]' ) ) {
					ratio = ( $container.data( 'video-height' ) / $container.data( 'video-width') ) * 100;
					$container.css( 'padding-bottom', ratio + "%")
				}
				$container.append( $player ); 
				brightcove.createExperiences();
			}
		}
	};

	geui.registerModule( video );


	return video.publicFn;

});



/*! Responsive Carousel - v0.1.0 - 2012-08-16
* https://github.com/filamentgroup/responsive-carousel
* Copyright (c) 2012 Filament Group, Inc.; Licensed MIT, GPL */

/*
 * responsive-carousel
 * https://github.com/filamentgroup/responsive-carousel
 *
 * Copyright (c) 2012 Filament Group, Inc.
 * Licensed under the MIT, GPL licenses.
 */

(function($) {
	
	var pluginName = "carousel",
		initSelector = "." + pluginName,
		transitionAttr = "data-transition",
		transitioningClass = pluginName + "-transitioning",
		itemClass = pluginName + "-item",
		activeClass = pluginName + "-active",
		inClass = pluginName + "-in",
		outClass = pluginName + "-out",
		navClass =  pluginName + "-nav",
		cssTransitionsSupport = (function(){
			/*
			//There was a problem with this detection method

			var prefixes = " -webkit- -moz- -o- -ms- ".split( " " ),
				supported = false;
			
			while( prefixes.length ){
				if( prefixes.shift() + "transition" in document.documentElement.style !== undefined ){
					supported = true;
				}
			}
			return supported;
			*/

			var b = document.body || document.documentElement;
		    var s = b.style;
		    var p = 'transition';
		    if(typeof s[p] == 'string') {return true; }

		    // Tests for vendor specific prop
		    v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
		    p = p.charAt(0).toUpperCase() + p.substr(1);
		    for(var i=0; i<v.length; i++) {
		      if(typeof s[v[i] + p] == 'string') { return true; }
		    }
		    return false;

		}()),
		
		methods = {
			_create: function(){

				//$( this ).data("init", "init")

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					[ pluginName ]( "_loadingImage" )
					[ pluginName ]( "_addNextPrev" )
					.trigger( "create." + pluginName );
			},
			
			_init: function(){
				var trans = $( this ).attr( transitionAttr );
				
				if( !trans ){
					cssTransitionsSupport = false;
				}

				$carousel = $( this );

				return $( this )
					.addClass(
						pluginName + 
						" " + ( trans ? pluginName + "-" + trans : "" ) + " "
					)
					.find( '.geui-hero-carousel-slides li' )
					.addClass( itemClass )
					.first()
					.addClass( activeClass );
			},
			
			next: function(){
				$( this )[ pluginName ]( "goTo", "+1" );
			},
			
			prev: function(){
				$( this )[ pluginName ]( "goTo", "-1" );
			},
			
			goTo: function( num ){
				
				var $self = $(this),
					trans = $self.attr( transitionAttr ),
					reverseClass = " " + pluginName + "-" + trans + "-reverse";
				
				// clean up children
				$( this ).find( "." + itemClass ).removeClass( [ outClass, inClass, reverseClass ].join( " " ) );
				
				var $from = $( this ).find( "." + activeClass ),
					prevs = $from.prevAll().length;
				var	activeNum = ( prevs || 0 ) + 1;
				var	nextNum = typeof( num ) === "number" ? num : activeNum + parseFloat(num),
					$to = $( this ).find( ".carousel-item" ).eq( nextNum - 1 ),
					reverse = ( typeof( num ) === "string" && !(parseFloat(num)) ) || nextNum > activeNum ? "" : reverseClass;

				if ( activeNum === num ) {
					return;
				}
				if( !$to.length ){
					$to = $( this ).find( "." + itemClass )[ reverse.length ? "last" : "first" ]();
				}

				if( cssTransitionsSupport  ){
					$self[ pluginName ]( "_transitionStart", $from, $to, reverse );
				}
				else {
					$to.addClass( activeClass );
					$self[ pluginName ]( "_transitionEnd", $from, $to, reverse );
				}
				
				// added to allow pagination to track
				$self.trigger( "goto." + pluginName, $to );
			},
			
			update: function(){
				$(this).children().not( "." + navClass ).addClass( itemClass );
				
				return $(this).trigger( "update." + pluginName );
			},
			
			_transitionStart: function( $from, $to, reverseClass ){
				var $self = $(this);
				
				$to.one( navigator.userAgent.indexOf( "AppleWebKit" ) > -1 ? "webkitTransitionEnd" : "transitionend", function(){
					$self[ pluginName ]( "_transitionEnd", $from, $to, reverseClass );
				});
				
				$(this).addClass( reverseClass );
				$from.addClass( outClass );
				$to.addClass( inClass );	
			},
			
			_transitionEnd: function( $from, $to, reverseClass ){
				$(this).removeClass( reverseClass );
				$from.removeClass( outClass + " " + activeClass );
				$to.removeClass( inClass ).addClass( activeClass );
			},
						
			_bindEventListeners: function(){

				var $elem = $( this )
					.bind( "click", function( e ){
						var targ = $( e.target ).closest( "a[href='#next'],a[href='#prev']" );
						if( targ.length ){
							$elem[ pluginName ]( targ.is( "[href='#next']" ) ? "next" : "prev" );
							// e.preventDefault();
						}
					});
				
				return this;
			},
			
			_loadingImage : function(){

				var $elem = $( this );

				var $img = $( this ).find('.geui-hero-carousel-slides li img');

				//Reset
				var aImg = [];
				var indexImg = 0;

				$.each($img, function(i, img){
					var src = $(img).attr("src");
					if(src.indexOf("http") == -1)
					{
						src = window.location.protocol + "//" + window.location.hostname + "/" + src;
					}

					aImg.push(src);
				})

				//loadImage(aImg, indexImg);
				$elem [ pluginName ]( "_loadImage", aImg, indexImg );

				return this;

			},

			_loadImage : function(aImg, indexImg){

				var $elem = $( this );

				var image = new Image();
				image.src = aImg[indexImg];
				
				if (image.complete || image.naturalWidth > 0) //cache
				{
					$elem [ pluginName ]( "_endLoadImage", aImg, indexImg );
				}
				else
				{
					$(image).load(function()
					{
						$elem [ pluginName ]( "_endLoadImage", aImg, indexImg );
						
					}).error(function()
					{
						$elem [ pluginName ]( "_endLoadImage", aImg, indexImg );
					});
				}

			},
			_endLoadImage : function(aImg, indexImg){

				var $elem = $( this );

				indexImg++;
			
				if (indexImg == aImg.length)
				{

					//Show them
					$elem.find('.geui-hero-carousel-slides li').css("display", "block");

					//Bind them
					if ( $( this ).find( ".carousel-item" ).size() >= 2 ) {
						$elem [ pluginName ]( "_bindEventListeners" );
					}
				}	
				else
				{
					$elem [ pluginName ]( "_loadImage", aImg, indexImg );
				}	
			},

			_addNextPrev: function(){
		
				var controls = "<div class=\"geui-hero-carousel-controls "+ navClass +"\">" +
                        	"<a href=\"#prev\" class=\"geui-hero-carousel-prev\" title=\"Prev\"><i class=\"geui-icon geui-icon-white geui-icon-left-arrow\"></i></a>" +
                            "<a href=\"#next\" class=\"geui-hero-carousel-next\" title=\"Next\"><i class=\"geui-icon geui-icon-white geui-icon-right-arrow\"></i></a>" +
                        "</div>";

                // Only apply if we have more than one slide
                if ( $( this ).find( ".carousel-item" ).size() < 2 ) {
                	return $( this );
                } else {
                	return $( this )
                		.append( controls )
                		
                }
			},
			destroy: function(){
				// TODO
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( "data-"+ pluginName + "data") ){
				return $( this );
			}

			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

}(jQuery));

/*
 * responsive-carousel touch drag extension
 * https://github.com/filamentgroup/responsive-carousel
 *
 * Copyright (c) 2012 Filament Group, Inc.
 * Licensed under the MIT, GPL licenses.
 */

(function($) {
	
	var pluginName = "carousel",
		initSelector = "." + pluginName,
		noTrans = pluginName + "-no-transition",
		// UA is needed to determine whether to return true or false during touchmove (only iOS handles true gracefully)
		iOS = /iPhone|iPad|iPod/.test( navigator.platform ) && navigator.userAgent.indexOf( "AppleWebKit" ) > -1,
		touchMethods = {
			_dragBehavior: function(){
				var $self = $( this ),
					origin,
					data = {},
					xPerc,
					yPerc,
					setData = function( e ){
						
						var touches = e.touches || e.originalEvent.touches,
							$elem = $( e.target ).closest( initSelector );
						
						if( e.type === "touchstart" ){
							origin = { 
								x : touches[ 0 ].pageX,
								y: touches[ 0 ].pageY
							};
						}

						if( touches[ 0 ] && touches[ 0 ].pageX ){
							data.touches = touches;
							data.deltaX = touches[ 0 ].pageX - origin.x;
							data.deltaY = touches[ 0 ].pageY - origin.y;
							data.w = $elem.width();
							data.h = $elem.height();
							data.xPercent = data.deltaX / data.w;
							data.yPercent = data.deltaY / data.h;
							data.srcEvent = e;
						}

					},
					emitEvents = function( e ){
						setData( e );
						$( e.target ).closest( initSelector ).trigger( "drag" + e.type.split( "touch" )[ 1], data );
					};

				$( this )
					.bind( "touchstart", function( e ){
						$( this ).addClass( noTrans );
						emitEvents( e );
					} )
					.bind( "touchmove", function( e ){
						setData( e );
						emitEvents( e );
						if( !iOS ){
							e.preventDefault();
							window.scrollBy( 0, -data.deltaY );
						}					
					} )
					.bind( "touchend", function( e ){
						$( this ).removeClass( noTrans );
						emitEvents( e );
					} );
					
					
			}
		};
			
	// add methods
	$.extend( $.fn[ pluginName ].prototype, touchMethods ); 
	
	// DOM-ready auto-init
	$( initSelector ).live( "create." + pluginName, function(){
		$( this )[ pluginName ]( "_dragBehavior" );
	} );

}(jQuery));
/*
 * responsive-carousel touch drag transition
 * https://github.com/filamentgroup/responsive-carousel
 *
 * Copyright (c) 2012 Filament Group, Inc.
 * Licensed under the MIT, GPL licenses.
 */

(function($) {
	
	var pluginName = "carousel",
		initSelector = "." + pluginName,
		activeClass = pluginName + "-active",
		itemClass = pluginName + "-item",
		dragThreshold = function( deltaX ){
			return Math.abs( deltaX ) > 4;
		},
		getActiveSlides = function( $carousel, deltaX ){
			var $from = $carousel.find( "." + pluginName + "-active" ),
				activeNum = $from.prevAll().length + 1,
				forward = deltaX < 0,
				nextNum = activeNum + (forward ? 1 : -1),
				$to = $carousel.find( "." + itemClass ).eq( nextNum - 1 );
				
			if( !$to.length ){
				$to = $carousel.find( "." + itemClass )[ forward ? "first" : "last" ]();
			}
			
			return [ $from, $to ];
		};
		
	// Touch handling
	$( initSelector )
		.live( "dragmove", function( e, data ){

			if( !dragThreshold( data.deltaX ) ){
				return;
			}
			var activeSlides = getActiveSlides( $( this ), data.deltaX );
			
			activeSlides[ 0 ].css( "left", data.deltaX + "px" );
			activeSlides[ 1 ].css( "left", data.deltaX < 0 ? data.w + data.deltaX + "px" : -data.w + data.deltaX + "px" );
		} )
		.live( "dragend", function( e, data ){
			if( !dragThreshold( data.deltaX ) ){
				return;
			}
			var activeSlides = getActiveSlides( $( this ), data.deltaX ),
				newSlide = Math.abs( data.deltaX ) > 45;
			
			$( this ).one( navigator.userAgent.indexOf( "AppleWebKit" ) ? "webkitTransitionEnd" : "transitionEnd", function(){
				activeSlides[ 0 ].add( activeSlides[ 1 ] ).css( "left", "" );
			});			
				
			if( newSlide ){
				activeSlides[ 0 ].removeClass( activeClass ).css( "left", data.deltaX > 0 ? data.w  + "px" : -data.w  + "px" );
				activeSlides[ 1 ].addClass( activeClass ).css( "left", 0 );
			}
			else {
				activeSlides[ 0 ].css( "left", 0);
				activeSlides[ 1 ].css( "left", data.deltaX > 0 ? -data.w  + "px" : data.w  + "px" );	
			}
		} );
		
}(jQuery));

/*
 * responsive-carousel pagination extension
 * https://github.com/filamentgroup/responsive-carousel
 *
 * Copyright (c) 2012 Filament Group, Inc.
 * Licensed under the MIT, GPL licenses.
 */

(function( $, undefined ) {
	var pluginName = "carousel",
		initSelector = "." + pluginName + "[data-paginate]",
		paginationClass = pluginName + "-pagination",
		activeClass = pluginName + "-active-page",
		paginationAttr = "data-paginate-view",
		paginationMethods = {
			_createPagination: function(){

				var nav = $( this ).find( "." + pluginName + "-nav" ),
					items = $( this ).find( "." + pluginName + "-item" ),
					pNav = $( "<ol class='" + paginationClass + "'></ol>" ),
					num;
				
				// remove any existing nav
				nav.find( "." + paginationClass ).remove();
				
				var li = "";
				for( var i = 0, il = items.length; i < il; i++ ){
					num = i + 1;
					li += "<li><a href='#" + num + "' title='Go to slide " + num + "'>" + num + "</a>" ;
				}

				pNav.append(li);

				nav
					.addClass( pluginName + "-nav-paginated" )
					.find( "a" ).first().after( pNav );

				var ofText = $("<div>").addClass("carousel-text");
				$("<span>")
					.addClass("carousel-of")
					.text("1")
					.appendTo(ofText);
				
				$("<span>")
					.text(" of ")
					.appendTo(ofText);
				
				$("<span>")
					.addClass("carousel-total")
					.text(items.length)
					.appendTo(ofText);

				$("<span>")
					.addClass("carousel-caption")
					.appendTo(ofText);

				nav
					.append(ofText);
			},
			_bindPaginationEvents: function(){
				$( this )
					.bind( "click", function( e ){
						var pagLink = $( e.target ).closest( "a" ),
							href = pagLink.attr( "href" );
						
						if( pagLink.closest( "." + paginationClass ).length && href ){
							$( this )[ pluginName ]( "goTo", parseFloat( href.split( "#" )[ 1 ] ) );
							// e.preventDefault();
						}
					} )
					// update pagination on page change
					.bind( "goto." + pluginName, function( e, to  ){
						
						var index = to ? $( to ).index() : 0;
							
						$( this ).find( "ol." + paginationClass + " li" )
							.removeClass( activeClass )
							.eq( index )
								.addClass( activeClass );
						
						$( this ).find( ".carousel-of")
							.text( index + 1 );

						var cap = $( this ).find("ul.geui-hero-carousel-slides li").eq(index).attr("data-caption");
						$( this ).find(".carousel-caption").text( (cap != undefined) ? ": " + cap : "");

					} )
					// initialize pagination
					.trigger( "goto." + pluginName );
			},
			_showHideText: function(){
				var pview = $( this ).attr( paginationAttr );
				if ( "text" == pview && $( this ).find( ".carousel-item" ).size() > 1 ) {
					$( this ).find(".carousel-pagination").hide().siblings(".carousel-text").show();
				}
			}
		};
			
	// add methods
	$.extend( $.fn[ pluginName ].prototype, paginationMethods ); 
	
	// create pagination on create and update
	$( initSelector )
		.live( "create." + pluginName, function(){
			$( this )
				[ pluginName ]( "_createPagination" )
				[ pluginName ]( "_bindPaginationEvents" )
				[ pluginName ]( "_showHideText" );
		} )
		.live( "update." + pluginName, function(){
			$( this )[ pluginName ]( "_createPagination" );
		} );

}(jQuery));


/*
 * responsive-carousel text align extension
 * Created for GE.com by The Barbarian Group, LLC
 * Licensed under the MIT, GPL licenses.
 */

(function( $, undefined ) {
	var pluginName = "carousel",
		initSelector = "." + pluginName,
		stretchClass = "fitline",
		verticalCenterClass = "vertical-center",
		textMethods = {
			_textSetup: function(){
				var $carousel = $( this ),
					interval,
					delay = 500,
					heightCheck = function() {
						if ($carousel.height() > 60 ) {
							$carousel.find( '.' + stretchClass ).fitTextOnLine();
							$carousel.find( '.' + verticalCenterClass ).verticallyCenter();
						} else {
							interval = setTimeout( heightCheck, delay );
						}
					};
				interval = setTimeout( heightCheck, delay );
			}
		};
			
	// add methods
	$.extend( $.fn[ pluginName ].prototype, textMethods ); 
	
	// create pagination on create and update
	$( initSelector )
		.live( "create." + pluginName, function(){
			$( this )[ pluginName ]( "_textSetup" );
		} )
		.live( "update." + pluginName, function(){
			$( this )[ pluginName ]( "_textSetup" );
		} );

}(jQuery));

/*! 
* GE UI Timeline 
* Build a timeline event of 24h of GE
*
*/

(function($) {
	
	var pluginName    = "timeline",
		initSelector  = ".geui-" + pluginName,

		_tpl = '<div class="container">'+
					'<div class="span12">'+
			            '<h3>The GE world in the last 24 hours</h3>'+
			            '<span class="today"></span>'+
			            '<div class="chart">'+
			                '<div class="bg">'+
			                    '<div class="grid">'+
			                        '<span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span class="last"></span>'+
			                    '</div>'+
			                    '<div class="date-line">'+
			                        '<span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span>'+
			                    '</div>'+
			                    '<div class="date">'+
			                        '<span class="date-yesterday"></span>'+
			                        '<span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="date-today"></span>'+
			                    '</div>'+
			                '</div>'+
			                '<div class="events-dots">'+
			                '</div>'+
			                '<div class="grid-bar-container">'+
			                    '<span class="grid-bar"></span>'+
			                '</div>'+
			            '</div>'+
			        '</div>'+
				'</div>'+
			    '<div class="drag">'+
			       '<div class="container">'+
			            '<div class="span12">'+
			                '<span class="bar">'+
			                   '<span  class="bar-arrow bar-arrow-left"><</span>'+
			                    '<span class="txt">DRAG</span>'+
			                    '<span class="bar-arrow bar-arrow-right">></span>'+
			                '</span>'+
			            '</div>'+
			        '</div>'+
			    '</div>',

		/* Util */

		_getDate = function(){

			var t = new Date();
			var m = t.getMinutes();

			if( m != 0) //Has to be rounded UP
			{
				var time = t.getTime();
				if ( m > 30 )
				{	
					time += ( ( 3600 - ( m * 60 ) ) * 1000 );
				}
				else
				{	
					time -= ( m * 60 * 1000 );
				}

				t.setTime(time);
			}

			return t;

		},

		_getDateTM1 = function(){

			var t = _dateT;
			var y = new Date();
			y.setTime( t.getTime() - ( 24 * 3600 ) * 1000 );
			return y;

		},

		_getStrTime = function(nb){

			if(nb < 10)
			{
				nb = "0"+ nb;
			}
			return nb;
		},

	 	_parseISO8601 = function (str) {

			// we assume str is a UTC date ending in 'Z'
			var parts = str.split('T'),
			dateParts = parts[0].split('-'),
			timeParts = parts[1].split('Z'),
			timeSubParts = timeParts[0].split(':'),
			timeSecParts = timeSubParts[2].split('.'),
			timeHours = Number(timeSubParts[0], 10),
			_date = new Date();

			_date.setFullYear(Number(dateParts[0]));
			//_date.setUTCDate(1);
			_date.setMonth(Number(dateParts[1])-1);
			_date.setDate(Number(dateParts[2]));
			_date.setHours(timeHours);
			_date.setMinutes(Number(timeSubParts[1]));
			_date.setSeconds(Number(timeSecParts[0]));
			if (timeSecParts[1]) {
				_date.setMilliseconds(Number(timeSecParts[1]));
			}

			// by using setUTC methods the date has already been converted to local time(?)
			return _date;

		},

		_changeToCurrentDate = function(event){

			//var t = event.date.getTime();
			var tM1 = _dateTM1.getTime();

			//add milliseconds randomly
			var ms = tM1 + Math.floor( Math.random() * 24 * 3600 * 1000 );

			event.date.setTime(ms);

		},

		_isInit 	= false,
		_isDebug 	= false,
		_isDragging = false,
		_isTablet   = false,
		_startDate  = {
			hour   : 6,
			minute : 0,
			AM     : false
		}, 
		_dateT      = _getDate(),
		_dateTM1    = _getDateTM1(),
		_aMonths    = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		_gridItemWidth = 0,
		_gridItemHeight = 97,

		_event = {
			margin : 16,
			width  : 356,
			current : null
		},

		_$aDots = null,

		_mouse = {
			x : 0,
			y : 0
		},

		_barHandler = {
			x      : 0,
			margin : 53,
			xMin   : 0,
			xMax   : 0
		},

		_$ = {
			timeline        : null,
			BgContainer		: null,
			eventsDotsContainer : null,
			dotsContainer 	: null,
			gridItem 	 	: null,

			//drag
			gridBar			: null,
			dragTxt	    	: null,
			bar 			: null
		},

		/* Events */

		_aEvents = [],

		_getDataFromJson = function(dataSource)
		{
			//ajax

			_$.timeline.addClass("geui-loader");
			
		    jQuery.ajax({
				type: 'GET', 
			 	url: dataSource,
			 	dataType: 'json',
				success: function(data, textStatus, jqXHR) {
					_$.timeline.removeClass("geui-loader"); 
					_bindMouseEvent();
					_initEvents(data);
					
				},
				error: function(jqXHR, textStatus, errorThrown) {
				    console.log(jqXHR, textStatus, errorThrown)
				}
			});
		},

		_initEvents = function(data){

			var t = new Date(); //real

			var todayH = _dateT.getHours();
			if(todayH >= 12)
			{
				todayH -= 12;
			}

			var yesterdayH = _dateTM1.getHours();
			if(yesterdayH >= 12)
			{
				yesterdayH -= 12;
			}

			var today = _aMonths[t.getMonth()] + " " + t.getDate() + ", " + _getStrTime(todayH) + ":"+ _getStrTime(t.getMinutes()) + ":" +t.getSeconds();
			if(t.getHours() >= 12)
			{
				today += "PM";
			}
			else
			{
				today += "AM";
			}


			var todayGrid = "Today, "+_getStrTime(todayH) + ":"+ _getStrTime(_dateT.getMinutes());
			if(_dateT.getHours() >= 12)
			{
				todayGrid += "PM";
			}
			else
			{
				todayGrid += "AM";
			}

			var yesterday  = /*_aMonths[_dateTM1.getMonth()].substr(0, 3) + " " + _dateTM1.getDate()+ ", " + */_getStrTime(yesterdayH) + ":" + _getStrTime(_dateTM1.getMinutes());
			if(_dateTM1.getHours() >= 12)
			{
				yesterday += "PM";
			}
			else
			{
				yesterday += "AM";
			}

			_$.timeline.find(".today").html(today);
			_$.timeline.find(".date-yesterday").html(yesterday);
			_$.timeline.find(".date-today").html(todayGrid);

			// Init Event
			for (var i = 0; i < data.events.length ; i++){

				var event = data.events[i];
				event.date = _parseISO8601(event.date); //UTC (Month -1)

				if(_isDebug)
				{
					_changeToCurrentDate(event);
				}

				if (event.date.getTime() < ( _dateTM1.getTime() - ( 3600 * 1000 ) ) || event.date.getTime() > _dateT.getTime())
				{
					continue;
				}
				else
				{
					_aEvents.push(event);
				}
			}

			delete i;

			for (var j = 0; j < _aEvents.length ; j++){
				var event = _aEvents[j];
				_createEvent(event);
			}

			delete j;
			// End Init Event

			// Init grid
			$.each(_$.timeline.find(".hour"),function(i, item){

				var h = _dateTM1.getHours() + (4 * (i+1) );

				if( h >= 24)
				{
					h -= 24;
				}

				if(h >= 12)
				{
					h -= 12;
					h += ":00PM";
				}
				else
				{
					h += ":00AM";
				}

				$(item).html(h);
			})

			// Break the timeline
			$.each(_$.timeline.find(".grid span"), function(i, span){

				var h = _dateTM1.getHours() +  (i+1);

				//h = 23 : break the timeline
				if(h == 24){

					$(span).html( '<span>' + _aMonths[_dateTM1.getMonth()] + " " + _dateTM1.getDate() + '</span>' ).addClass("break");

				}

			});

			_$aDots = _$.eventsDotsContainer.find(".dot");

			/* Event */

			//Direct access (tablet)
			/*
			_$aDots.on("click", function(e){

				e.preventDefault();

				_barHandler.x = $(this).position().left;

				if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

				_gotoEvent();
			})
			*/

			_$.eventsDotsContainer.on("click", function(e){

				e.preventDefault();

				if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

			}).children(".dot").on("click", function(e){

				e.preventDefault();
				e.stopPropagation();

				_barHandler.x = $(this).position().left;

				if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

				_gotoEvent();
			})

			_isInit = true;
		},

		_createEvent = function(event){

			var classDot = "";
			event.dot = {}; //init

			switch(event.type){
				case "twitter" : classDot = "twitter"; event.dot.height = 8;  event.dot.width = 8; break;
				case "event"   : classDot = "evt";     event.dot.height = 16; event.dot.width = 16;break;
				case "social"  : classDot = "social";  event.dot.height = 8;  event.dot.width = 8; break;
			}

			/* DOT */

			var $dot = $('<span class="dot '+ classDot +'"><span class="front"></span><span class="back"></span></span>');
			event.dot.$ = $dot;

			_positionDotEvent(event);
			_$.eventsDotsContainer.append($dot);

			/* EVENT */

			event.evt = {};

			var classEvt = "";
			if(event.dot.x < _$.eventsDotsContainer.width() / 2)
			{
				classEvt = "left";
			}

			var hour = event.date.getHours();
			var minute = _getStrTime (event.date.getMinutes());

			if(hour > 12)
			{

				hour -= 12;

				minute += "PM";
			}
			else
			{
				minute += "AM";
			}

			event.evt.$ = $('<div class="event evt '+ classEvt +'">'+
	                        '<span class="geui-circle geui-circle-small-icon"><i class="geui-icon geui-icon-white geui-icon-moving"></i></span>'+
	                        '<div class="event-content">'+
	                            '<div class="title"><h4>'+ event.title +'</h4><span class="date">'+ _getStrTime(hour) +':'+ minute +'</span></div>'+
	                            '<p>'+ event.text +'</p>'+
	                        '</div>'+
	                    '</div>');

			_positionEvent(event);	        
	        _$.eventsDotsContainer.append(event.evt.$);

		},

		_positionDotEvent = function(event){

			//hour
			var hour = event.date.getHours();
			var minute = event.date.getMinutes();

			//has to be rounded UP (just for the display)?
			if (event.date.getTime() < _dateTM1.getTime() ){
				//hour ++;
				hour = _dateTM1.getHours();

				if(hour == 24)
				{
					//+1day
					hour = 0;
				}

				minute = 0;
			}


			var indexHour = hour - _dateTM1.getHours();
			if(indexHour < 0 ) //day after
			{
				indexHour = 24 -  _dateTM1.getHours() + hour;
			}

			// /console.log(event, hour, _dateTM1.getHours(), indexHour)

			//minute
			var minute = (_gridItemWidth / 60) * event.date.getMinutes();

			//If 11PM, EXCEPTION
			if(hour == 23){
				
				minute = (_gridItemWidth / 60) * 27;
				indexHour += 1;
				if(indexHour > 24)
				{	
					indexHour == 22;
				}

			}

			//left
			var left = (indexHour * _gridItemWidth) + minute;

			//Not to close
			if( left < ( event.dot.width + (event.dot.width / 2) ) )  // + (event.dot.width / 2) = hover
			{
				left =  event.dot.width + (event.dot.width / 2);
			}
			else if ( left > (_$.eventsDotsContainer.width() - (event.dot.width + (event.dot.width / 2) ) ) )
			{
				left = _$.eventsDotsContainer.width() - (event.dot.width + (event.dot.width / 2) );
			}

			if(!_isInit) //calculate random top position
			{
				var top = 20 + Math.floor( Math.random() * (_gridItemHeight + 1 - event.dot.height - 36 ) ) 
				event.dot.$.css({left : left, top : top});
			}
			else
			{
				event.dot.$.css({left : left });
			}

			event.dot.x = left;


		},

		_positionEvent = function(event){

			var leftEvent = 0;
	        if(event.dot.x < _$.eventsDotsContainer.width() / 2)
	        {
	        	leftEvent = event.dot.x - _event.margin;

	        	if(leftEvent < 0)
	        	{
	        		leftEvent = 0;
	        	}
	        }
	        else
	        {
	        	leftEvent = event.dot.x  - _event.width + (event.dot.width / 2) + _event.margin;

	        	if(leftEvent + _event.width > _$.eventsDotsContainer.width())
	        	{
	        		leftEvent = _$.eventsDotsContainer.width() - _event.width;
	        	}
	        }

	        event.evt.$.css({ left : leftEvent});

		},

		_gotoEvent = function(){

			var eventR = null,
			 	eventL = null;

			//reset
			_event.current = null;

			//+1h
			for (var i = 0; i < _aEvents.length ; i++){
				var event = _aEvents[i];
				if( event.dot.x >= _barHandler.x && event.dot.x <= _barHandler.x + _gridItemWidth )
				{
					eventR = event;
					break;
				}
			}

			delete i;

			//-1h
			for (var j = 0; j < _aEvents.length ; j++){
				var event = _aEvents[j];
				if( event.dot.x <= _barHandler.x && event.dot.x >= _barHandler.x - _gridItemWidth )
				{
					eventL = event;
					break;
				}
			}

			delete j;

			if(eventR != null || eventL != null )
			{

				if(eventR != null && eventL != null)
				{
					//console.log("test", eventL.dot.x + eventL.dot.width, eventR.dot.x, _barHandler.x, eventR.dot.x - _barHandler.x,  _barHandler.x - (eventL.dot.x + eventL.dot.width), ( eventR.dot.x - _barHandler.x ) < ( _barHandler.x - eventL.dot.x + eventL.dot.width ))
					_event.current = ( ( eventR.dot.x - _barHandler.x ) < ( _barHandler.x - (eventL.dot.x + eventL.dot.width) ) ) ? eventR : eventL;
				}
				else if (eventR == null && eventL != null)
				{
					_event.current = eventL;
				}
				else if (eventR != null && eventL == null)
				{
					_event.current = eventR;
				}

			}
			
			
			if (_event.current != null)
			{

				//dots
				_$aDots.removeClass("active");
				_event.current.dot.$.addClass("active");

				//bar
				_$.bar.stop().animate({ left : _event.current.dot.x - _barHandler.margin + (_event.current.dot.width / 2) }, { duration: 300 });
	            _$.gridBar.stop().animate({ left : _event.current.dot.x + (_event.current.dot.width / 2) }, { duration: 300 });

	            //event
	            _event.current.evt.$.show();
			}
		},

		/* Mouse Event */

		_bindMouseEvent = function(){

			$(document.body).on("mousedown", ".bar", function (e) {

				console.log("mouseup")

		        _isDragging = true;
		        _mouse.x    = e.pageX - _$.bar.position().left ;

		        if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

		        e.preventDefault();
		    });

		    $(document.body).on("mouseup", function (e) {
		        _isDragging = false;
		        _$.dragTxt.html("DRAG");
		        _gotoEvent();
		    }).on("mouseout", function(e){

		    	//out of window
		    	if(e.relatedTarget == null ||  e.relatedTarget.nodeName == "HTML")
		    	{
		    		if(_isDragging)
		    		{
		    			$(document.body).trigger("mouseup")
		    		}	
		    	}
		    });

		    $(document.body).on("mousemove", _onDrag);

		},

		_onDrag = function(e){

			if (_isDragging) {
	            
	            var left = e.pageX - _mouse.x;

	            if(left < _barHandler.xMin)
	           	{
	           		left = _barHandler.xMin;
	           	}
	           	else if(left > _barHandler.xMax)
	           	{
	           		left = _barHandler.xMax;
	           	}

	           	_barHandler.x = left + _barHandler.margin; //coord in grid

	           	var yH = _dateTM1.getHours();
	           	var yM = _dateTM1.getMinutes();

	           	var minutes = parseInt( _barHandler.x * ( 60 / _gridItemWidth ) );
	           	var hour  	= Math.floor(minutes / 60);

	           	var dragH = yH + hour;
	           	var dragM = _getStrTime( minutes % 60);

	           	if(dragH == 23)
	           	{
	           		dragH = "DRAG";
	           	}
	           	else {

	           		if( dragH >= 24)
					{
						dragH -= 24;
					}

					if(dragH >= 12)
					{
						dragH -= 12;
						dragH += ":"+ dragM +"PM";
					}
					else
					{
						dragH += ":"+ dragM +"AM";
					}

	           	}

	           	

	            _$.bar.css({ left : left });
	            _$.gridBar.css({ left : left + _barHandler.margin });
	            _$.dragTxt.html(dragH);
	        }

	         e.preventDefault();
		},

		/* Window Event */

		_onResize = function(e){

			_barHandler.xMin = - _barHandler.margin;
			_barHandler.xMax = _$.eventsDotsContainer.width() - _barHandler.margin;

			if( $(window).width() >= 1200)
      		{
      			_gridItemWidth    = 48.75;//_$.gridItem.outerWidth();
      		}
			else if( $(window).width() >= 768 && $(window).width() <= 979)
      		{
      			_gridItemWidth    = 30.1666667//_$.gridItem.outerWidth();
      		}
      		else
			{
				_gridItemWidth    = 39.1666667//_$.gridItem.outerWidth();
			}

			for (var j = 0; j < _aEvents.length ; j++){

				var event = _aEvents[j];

				_positionDotEvent(event);
				_positionEvent(event)
			}

			delete j;
		},

		

		methods = {
			_create: function(){
				// Disable for mobile
				if(Modernizr.mq('only all and (max-width: 767px)'))
				{
					return false;
				}

				//is Tablet
				if(Modernizr.mq('only all and (max-width: 979px) and (min-width: 768px)'))
				{
					_isTablet = true;
				}

				/*
				if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) 
				{
					return false;
				}
				*/

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					[ pluginName ]( "_bindEventListeners" )
					.trigger( "create." + pluginName );
			},
			_init: function(){

				var $timeline = _$.timeline = $( this );

  				if(window.location.hash.substring(1) == "debug") 
  				{
  					_isDebug = true;
  				}

				$timeline.html(_tpl);

				$timeline.attr('unselectable', 'on')
                 			.css('user-select', 'none')
                 			.on('selectstart', false);

				_$.eventsDotsContainer 	= $timeline.find(".events-dots");
				_$.BgContainer 	= $timeline.find(".bg");
				//_$.dotsContainer 	= $timeline.find(".dots");
				_$.gridItem 		= $timeline.find(".grid span:eq(0)");
				


				_$.gridBar 			= $timeline.find(".grid-bar");
				_$.bar 				= $timeline.find(".bar");
				_$.dragTxt 			= _$.bar.find(".txt");

				return $timeline;

			},
			_bindEventListeners : function(){

				var $timeline = $( this );

			    $(window).resize(_onResize);
			    _onResize();

			    //Get Data
			    var dataSource =  $timeline.data("source");

			    if(dataSource == undefined)
			    {
			    	dataSource = '/data/timeline.json';
			    	_getDataFromJson(dataSource);
			    }	
			    else
			    {
			    	//get data direct from source
				    if(dataSource.indexOf(".json") == -1){
				    	_bindMouseEvent();
				    	_initEvents(JSON.parse($("#" + dataSource).html()))
				    }
				    else {
				    	_getDataFromJson(dataSource);
				    }
			    }

				return $timeline;
			},
			destroy: function(){
				
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "data" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

}(jQuery));
/*! 
* GE UI Videoplayer 
* part of the GE UI Kit
* Creates a popup player for links
*
*/

require( ['jQuery', 'lodash', 'geui/video'], function( $, _, geuiVideo ) {

	var pluginName    = "videoplayer",
		initSelector  = ".geui-" + pluginName,
		tpl           = '<div class="geui-'+ pluginName+'-overlay"></div> '+
						'<div class="geui-'+ pluginName+'-container container container-fixed">'+
							'<a href="#" title="Close" class="geui-'+ pluginName+'-close" >X</a>'+
					    	'<div class="geui-'+ pluginName+'-player"></div>'+
					    '</div>',
		$tplOverlay   = null,
		$tplContainer = null,
		$videoContainer = null,
		$close 		  = null,
		marginVideoContainer = 15,
		videoId = {
			yt : null,
			bc : null
		},

		size = {
			maxWidth : 640,
			maxHeight : 360,
			ratio : 16/9
		},

		resizer = _.throttle( function(){
	
			if($tplContainer == null)
				return;

			var wContainerDefault = 940;

			if($(window).width() >= 1200)
			{
				wContainerDefault = 1170;
			}
			else if( $(window).width() < 979 && $(window).width() > 768 )
			{
				wContainerDefault = 724;
			}
			else if( $(window).width() < 767  )
			{
				wContainerDefault = $(window).width();
			}

			var w = wContainerDefault;

			//max wdth ?
			if (w > size.maxWidth)
				w = size.maxWidth;

			var h = w / size.ratio;
			var top = $(window).height() / 2 - h / 2 - $close.height() / 2;

			if (top <= 0)
			{
				top = $(window).height() / 8;
			}

			if ( h > $(window).height() - top)
			{
				h = $(window).height() - ( 2 * top)
				w = h * size.ratio;
			}

			var left = $(window).width() / 2 - w / 2;

			$tplContainer.css({top : top, width : w , marginLeft:0, left:left});
			$videoContainer.css({height : h, width : w - (2 * marginVideoContainer) })


		}, 100),

		_onKeyDown = function(e){

			switch( e.keyCode ) {
				// esc
				case 27:
					// trigger our click handler
					$close
						.trigger( "click" );
					break;
				
			}

		},

		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					.trigger( "create." + pluginName );
			},
			_init: function(){

				var $btnPlayer = $( this );

				videoId.yt = $btnPlayer.data("video-yt");
				videoId.bc = $btnPlayer.data("video-bc");

				size.maxWidth  = ( $btnPlayer.data("video-width")  == undefined || $btnPlayer.data("video-width").length == 0 ) ? size.maxWidth : $btnPlayer.data("video-width");
				size.maxHeight = ( $btnPlayer.data("video-height") == undefined || $btnPlayer.data("video-height").length == 0 ) ? (size.maxWidth / size.ratio) : $btnPlayer.data("video-height");
				size.ratio = size.maxWidth / size.maxHeight;

				if( !videoId.yt && !videoId.bc)
					return $btnPlayer;

				$btnPlayer[ pluginName ]( "_bindEventListeners" );

				return $btnPlayer;
			},
			_bindEventListeners: function(){
				var $elem = $( this )
					.unbind("click.ge.video")
					.bind( "click.ge.video", function( e ){
						console.log( e, e.namespace );
						e.preventDefault();
						$elem[ pluginName ]( "_addTpl" );
					});
				
				return this;
			},
			_bindVideoplayerEventListeners: function(){
				var $elem = $( this )

				//Close
				$tplOverlay
					.unbind("click.ge.video")
					.bind( "click.ge.video", function( e ){
					e.preventDefault();
					$elem[ pluginName ]( "destroy" );
				});

				$close = $tplContainer.find('.geui-'+ pluginName+'-close');

				$close
					.unbind("click.ge.video")
					.bind( "click.ge.video", function( e ){
						e.preventDefault();
						$elem[ pluginName ]( "destroy" );
					});

				//Resize
				//$(window).
				$(window).on('resize', resizer);
				$(document).on("keydown", _onKeyDown);

				resizer();
				
				return this;
			},
			_addTpl : function(){

				var $elem = $( this ),
					$video;
	
				$( "body" ).prepend( tpl );

				$tplOverlay   = $( "body" ).find('.geui-'+ pluginName+'-overlay');
				$tplContainer = $( "body" ).find('.geui-'+ pluginName+'-container');

				$videoContainer = $tplContainer.find('.geui-'+ pluginName+'-player');

				$video = $( '<div class="geui-video"></div>' );

				_.each( ['yt', 'bc', 'height', 'width'], function( x ) {
					if ( $elem.data( 'video-' + x ) ) {
						$video.attr( 'data-video-' + x, $elem.data( 'video-' + x ) );
					}
				} );

				$videoContainer
					.append( $video );
				// render eet
				geuiVideo.render( $video );

				return $( this)
                		[ pluginName ]( "_bindVideoplayerEventListeners" );
			},
			destroy: function(){
				// TODO

				$(window).off('resize', resizer);
				$(document).off('keydown', _onKeyDown);

				$tplOverlay.remove();
				$("iframe", $videoContainer).hide(); //IE8 fix black screen
				$tplContainer.remove();

				$tplOverlay = null;
				$tplContainer = null;
				$videoContainer = null;
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "data" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

} );
/*! 
* GE UI Videoplayer 
* part of the GE UI Kit
* A lightweight wrapper around a video player
*
*/

(function($) {
	
	var pluginName    = "boxshadow",
		initSelector  = ".geui-" + pluginName,
		tpl           = '<div class="geui-'+ pluginName+'-wpshadow"><div class="geui-'+ pluginName+'-shadow"></div></div> ',
		$_shadow = null,
		$_wrapper = null,

		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				//if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					[ pluginName ]( "_addTpl" )
					.trigger( "create." + pluginName );
			},
			_init: function(){
				var $box = $( this );

				return $box;
			},
			_addTpl : function(){

				var $box = $( this );

				$_wrapper = $('<div class="geui-'+ pluginName+'-wrapper"></div>');
				$_shadow  = $( tpl );

				$box.wrap( $_wrapper )
					.after( $_shadow );

				//z-index
				var zIndex = $box.css("zIndex");

				$_wrapper.css({ zIndex : zIndex});
				$box.css({ zIndex : 1 });
				$_shadow.css({ zIndex : 0});

				return $( this);
			},
			destroy: function(){
				
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "data" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

}(jQuery));

(function($) {
	
	var pluginName    = "innershadow",
		initSelector  = ".geui-" + pluginName,
		tpl           = '<div class="geui-'+ pluginName+'-wpshadow"><div class="geui-'+ pluginName+'-shadow"></div></div> ',
		$_shadow = null,
		$_wrapper = null,

		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				//if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;
				
				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					[ pluginName ]( "_addTpl" )
					.trigger( "create." + pluginName );
			},
			_init: function(){
				var $box = $( this );

				return $box;
			},
			_addTpl : function(){

				var $box = $( this );

				$_wrapper = $('<div class="geui-'+ pluginName+'-wrapper"></div>');
				$_shadow  = $( tpl );

				$box.wrap( $_wrapper )
					.after( $_shadow );

				//z-index
				var zIndex = $box.css("zIndex");

				$_wrapper.css({ zIndex : zIndex});
				$box.css({ zIndex : 1 });
				$_shadow.css({ zIndex : 0});

				return $( this);
			},
			destroy: function(){
				
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "data" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

}(jQuery));
/*! 
* GE UI Select 
* part of the GE UI Kit
* A lightweight wrapper around jquery.selectBox.js
*
*/

(function($) {
	
	var pluginName = "select",
		initSelector = ".geui-" + pluginName,
		/*
		transitionAttr = "data-transition",
		transitioningClass = pluginName + "-transitioning",
		itemClass = pluginName + "-option",
		activeClass = pluginName + "-active",
		hoverClass = pluginName + "-hover",
		*/
		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					.trigger( "create." + pluginName );
			},
			_init: function(){
				var $select = $( this );

				// return if this has already been initialized
				if ( $select.is( '.selectBox' ) ) {
					return $select;
				}
				//Add tabcontrol
				$select.attr("tabindex", 0);

				$select.selectBox();
				
				$select
					.next()
						.find( '.selectBox-arrow' )
						.append( $( '<span />' )
							.addClass( 'geui-icon geui-icon-white geui-icon-down-arrow' ) );
				// changes for tracking
				$select
					.next()
						.attr( 'data-ga-notrack', true )
						.data( 'selectBox-options' )
							.attr('data-ga-category', $select.attr( 'id' ))
							.attr( 'data-ga-action', 'GEUI Select Change' );
				return $select;
			},
			destroy: function(){
				// TODO
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "active" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

}(jQuery));
/*! 
* GE UI Radio Buttons
* part of the GE UI Kit
* A lightweight wrapper around radio button inputs to allow for better presentation
*
*/

(function($) {
	
	var pluginName = "radioBtn",
		groupClass = "geui-radio-button-group",
		radioSelector = "input[type=radio]",
		initSelector = "." + groupClass + " " + radioSelector,
		labelClass = "geui-radio-button",
		tickClass = "geui-radio-button-tick",
		tickSelectedClass = "geui-radio-button-tick-selected",
		$allRadio = null,
		idxRadio = -1,
		methods = {
			_create: function(){
				// Disable for iOS devices (their native controls are more suitable for a touch device)
				if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) return false;

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					.trigger( "create." + pluginName );
			},
			_init: function(){
				var $radio = $( this ),
					$label = $radio.closest( 'label' ),
					$tick = $( '<span />' ),
					$group = $radio.closest( '.' + groupClass ),
					$allRadio = $group.find(radioSelector);

				// wrap the label in a div for handling tabbing
				 $label
				 	.wrap( '<div class="geui-radio-button-wrapper"></div>');

				

				//Add tabcontrol
 				$label
 					.parent()
 					.attr("tabindex", 0)
 					.focus(function(e){
 						idxRadio = $label.parents('.' + groupClass + ' > div').index();
 					})
 					.bind("keydown", function( evt ){
 						var $nextRadio, $prevRadio, next = idxRadio;
 						switch( evt.keyCode ) {
 							// enter
 							case 13:
 								// trigger our click handler
 								$label
 									.trigger( "click" );
 								break;
 							// right or down
 							case 39:
 							case 40:
 								// find the next radio button in this group and give it focus
 								next = idxRadio + 1;
				 				if(next > $allRadio.length - 1)
				 					next = 0;

 								$nextRadio = $group.find("label:eq("+next+")");
 								$nextRadio.parent().focus();

 								//change the radio button, which update the custon UI
 								$nextRadio.find("input[type=radio]").change();
 								break;
 							case 37:
 							case 38:
 								// find the previous radio button in this group and give it focus
				 				next = idxRadio - 1;
				 				if(next < 0)
				 					next = $allRadio.length - 1;

 								$prevRadio = $group.find("label:eq("+next+")");
 								$prevRadio.parent().focus();

 								//change the radio button, which update the custon UI
 								$prevRadio.find("input[type=radio]").change();
 								break;
 						}
 					});

				// bind a change event to the radio button, incase it's changed via javascript
				$radio
					.bind( 'focus.' + pluginName, function( evt ) {
						if ( !this.checked ) return;
						if ( !this.was_checked ) {
						  $( this ).change();
						}
					} )
					.bind( 'change.' + pluginName, function( evt ) {

						if ( this.was_checked ) {
						  evt.stopImmediatePropagation();
						  return;
						}
						$( "input[name=" + this.name + "]" ).each( function() {
						  this.was_checked = this.checked;
						} );

						//if(!this.checked)
						$radio[ pluginName ]( 'toggle' );
					} );

				$label
					.addClass( labelClass )
					.attr( 'tabindex', 0 );
				$tick
					.addClass( tickClass );

				$label
					.append( $tick );
				$label
					.bind( 'click.' + pluginName, function(evt) {
						evt.preventDefault();
						$radio[ pluginName ]( 'toggle' ); 
					} );

				//Prechecked ?
				if($radio[0].checked)
				{
					idxRadio = $label.parents('.' + groupClass + ' > div').index();
					$label.find("input[type=radio]").change();
				}	

				return $radio;
			},
			toggle: function() {
				var $radio = $( this ),
					$label = $radio.closest( 'label' ),
					$tick  = $label.find( '.' + tickClass ),
					$group = $radio.closest( '.' + groupClass );
				// unset the active radio button, if there is one

				$group.find( '.' + labelClass )
					.each( function() { 

						$( this )
							.find( '.' + tickSelectedClass )
							.removeClass( tickSelectedClass );
						$( this )
							.find( radioSelector )
								.attr( 'checked', false );
					} );

				$tick
					.addClass( tickSelectedClass );

				$radio
					.attr( 'checked', true );

				$radio.trigger( "change." + pluginName );

				return $radio;
			},
			uncheck : function(){
				var $radio = $( this );

				this.checked = false;
				$radio.attr("checked", false).change();				

			},
			destroy: function(){
				// TODO
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "data" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

}(jQuery));