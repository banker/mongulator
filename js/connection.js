/*
TryMongo
Author: Kyle Banker (http://www.kylebanker.com)
Date: September 1, 2009
 
(c) Creative Commons 2009
http://creativecommons.org/licenses/by-sa/2.5/
*/

var Connection = function() {
};

Connection.prototype = {
  
  initialize: function() {
  },

  insert: function(collectionName, doc) {
    console.log('inserted ' + Inspect(doc) + ' ' + collectionName);
    $.post('/insert/', {name: collectionName, doc: doc});
    return doc._id;
  },

  update: function(collectionName, query, doc, upsert, multi) {
    console.log('updated ' + collectionName + " with query " + Inspect(query) + " and docect " + Inspect(doc));
    return doc._id;
  },

  remove: function(collectionName, doc) {
    console.log('remove ' + collectionName + ' ' + Inspect(doc));
    return "ok"; 
  },


  // Should return the first set of results for a cursor docect.
  find: function() {
    
  }
};
