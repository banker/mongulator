// Try Mongo
//
// Copyright (c) 2009 Kyle Banker
// Licensed under the MIT licence.
// http://www.opensource.org/licenses/mit-license.php

Array.prototype.include = function(value) {
  for(var i=0; i < this.length; i++) {
    if(this[i] == value) {
      return this[i];
    }
  }
  return false;
};

Array.prototype.empty = function() {
  return (this.length == 0);
};

Function.prototype.bind = function() {
  var __method = this, object = arguments[0], args = [];

  for(i = 1; i < arguments.length; i++) {
   args.push(arguments[i]);
  }

 return function() {
 return __method.apply(object, args);
 };
}; 

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g,"");
};

// Prints javascript types as readable strings.
Inspect = function(obj) {
  if(typeof(obj) != 'object') {
    return obj;
  }

  else if (obj instanceof Array) {
    var objRep = [];
    for(var prop in obj) { 
      if(obj.hasOwnProperty(prop)) {
        objRep.push(obj[prop]); 
      }
    }
    return '[' + objRep.join(', ') + ']';
  }

  else {
    var objRep = [];
    for(var prop in obj) {
      if(obj.hasOwnProperty(prop)) {
        objRep.push(prop + ': ' + ((typeof(obj[prop]) == 'object') ? Inspect(obj[prop]) : obj[prop]));
      }
    }
    return '{' + objRep.join(', ') + '}';
  }
};

// Prints an array of javascript objects.
CollectionInspect = function(coll) {
  var str = '';
  for(var i=0; i<coll.length; i++) {
    str += Inspect(coll[i]) + '<br />'; 
  }
  return str;
};
