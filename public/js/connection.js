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
    delete doc['_id'];
    $.post('/insert', {name: collectionName, doc: tojson(doc)});
    return 'ok';
  },

  update: function(collectionName, query, doc, upsert, multi) {
    $.post('/update', {name: collectionName, query: tojson(query), 
        doc: tojson(doc), upsert: upsert, multi: multi});
    return 'ok';
  },

  remove: function(collectionName, doc) {
    $.post('/remove', {name: collectionName, doc: tojson(doc)});
    return "ok"; 
  },

  // Should return the first set of results for a cursor docect.
  find: function() {
    return "find doesn't work yet."
  },

  toString: function() {
    return "Connection";
  }

};

