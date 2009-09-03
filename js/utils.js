/*
TryMongo
Author: Kyle Banker (http://www.kylebanker.com)
Date: September 1, 2009
 
(c) Creative Commons 2009
http://creativecommons.org/licenses/by-sa/2.5/
*/

Array.prototype.include = function(value) {
  for(var i=0; i < this.length; i++) {
    if(this[i] == value) {
      return this[i];
    }
  }
  return false;
}

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
}

// Prints javascript types as readable strings.
Inspect = function(obj) {
  if(typeof(obj) != 'object') {
    return obj;
  }

  else if ((obj instanceof Array) || (obj instanceof DBCollection)) {
    var objRep = [];
    for(p in obj) { 
      if(obj.hasOwnProperty(p)) {
        objRep.push(obj[p]); 
      }
    }
    return '[' + objRep.join(', ') + ']';
  }

  else {
    var objRep = [];
    for(p in obj) {
      if(obj.hasOwnProperty(p)) {
        objRep.push(p + ': ' + ((typeof(obj[p]) == 'object') ? Inspect(obj[p]) : obj[p]));
      }
    }
    return '{' + objRep.join(', ') + '}';
  }
}

// Prints an array of javascript objects.
CollectionInspect = function(coll) {
  var str = '';
  for(var i=0; i<coll.length; i++) {
    str += Inspect(coll[i]) + '<br />'; 
  }
  return str;
}
