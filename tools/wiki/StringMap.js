// Copyright (C) 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implements StringMap - a map api for strings.
 *
 * @author Mark S. Miller
 * @author Jasvir Nagra
 * @overrides StringMap
 */

define([], function() {
   "use strict";

   var create = Object.create;
   var freeze = Object.freeze;
   function constFunc(func) {
     func.prototype = null;
     return freeze(func);
   }

   function assertString(x) {
     if ('string' !== typeof(x)) {
       throw new TypeError('Not a string: ' + String(x));
     }
     return x;
   }

   var StringMap = function StringMap() {

     var objAsMap = create(null);

     return freeze({
       get: constFunc(function(key, defaultValue) {
         if (!this.has(key)) { return defaultValue; }
         return objAsMap[assertString(key) + '$'];
       }),
       set: constFunc(function(key, value) {
         objAsMap[assertString(key) + '$'] = value;
         return value;
       }),
       setdefault: constFunc(function(key, defaultValue) {
           if (!this.has(key)) {
             return this.set(key, defaultValue);
           }
           return this.get(key);
       }),
       has: constFunc(function(key) {
         return (assertString(key) + '$') in objAsMap;
       }),
       'delete': constFunc(function(key) {
         return delete objAsMap[assertString(key) + '$'];
       }),
       keys: constFunc(function() {
         var keys = [], k, base;
         for (k in objAsMap) {
           if (Object.hasOwnProperty.call(objAsMap, k) &&
               'string' === typeof(k) &&
               k.substr(-1) === '$') {
             keys.push(k.substr(0, k.length-1));
           }
         }
         return keys;
       })
     });
   };

   return StringMap;
});
