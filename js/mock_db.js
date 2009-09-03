/*
TryMongo
Author: Kyle Banker (http://www.kylebanker.com)
Date: September 1, 2009
 
(c) Creative Commons 2009
http://creativecommons.org/licenses/by-sa/2.5/
*/

// Generic database collection class.
Array.prototype.save = function() {
  if(arguments.length === 0 || !(arguments[0] instanceof Object)) {
    return "DB Error: Must pass an object to save";
  }
  if(arguments[0]) {
    this.push(arguments[0]);
    return 'ok';
  }
};

Array.prototype.find = function() {
  if(arguments.length === 0) {
    return CollectionInspect(this);
  }
};
