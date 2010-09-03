// TryMongo
//
// Copyright (c) 2009 Kyle Banker
// Licensed under the MIT Licence.
// http://www.opensource.org/licenses/mit-license.php

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
