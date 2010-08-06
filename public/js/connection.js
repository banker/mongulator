// TryMongo
//
// Copyright (c) 2009 Kyle Banker
// Licensed under the MIT Licence.
// http://www.opensource.org/licenses/mit-license.php

var AppBaseURL = ""

var Connection = function() {
  this.initialize();
};

Connection.prototype = {
  
  initialize: function() {
  },

  insert: function(collectionName, doc) {
    delete doc['_id'];
    $.post(AppBaseURL + 'insert', {name: collectionName, doc: tojson(doc)});
    return 'ok';
  },

  update: function(collectionName, query, doc, upsert, multi) {
    $.post(AppBaseURL + 'update', {name: collectionName, query: tojson(query), 
        doc: tojson(doc), upsert: upsert, multi: multi});
    return 'ok';
  },

  remove: function(collectionName, doc) {
    $.post(AppBaseURL + 'remove', {name: collectionName, doc: tojson(doc)});
    return 'ok'; 
  },

  // Should return the first set of results for a cursor docect.
  find: function(collectionName, query, fields, limit, skip) {
    query      = query  || {}
    fields     = fields || {}
    return new DBCursor(collectionName, query, fields, limit, skip);
  },

  runCommand: function() {
  }
};

var $emptyCursor = function() {
};

$emptyCursor.prototype = {
  iterate: function() {
    return "Cursor is empty or no longer available.";
  }
};

var $resetCursor = function() {
  $lastCursor = new $emptyCursor();
};

// Store the last created cursor for easy iteration.
$lastCursor = new $emptyCursor();

var DBCursor = function(collectionName, query, fields, limit, skip) {
  this.collectionName = collectionName;
  this.query          = tojson(query)  || {};
  this.fields         = fields ? tojson(fields) : tojson({});
  this.limit          = limit  || 0;
  this.skip           = skip   || 0;
  this.position       = 0;
  this.count          = 100;
  this.cache          = [];

  this.initialize();
};

DBCursor.prototype = {

  initialize: function() {
    $lastCursor = this;
    return this;
  },

  _sendQuery: function(name, query, fields, limit, skip) {
    var ctx = this;
    $.ajax({url: AppBaseURL + 'find', type: 'POST', async: false, dataType: "json",
        data: {name: this.collectionName, query: this.query,
               fields: this.fields, limit: this.limit,
               skip: skip},
        complete: function() { },
        success: function(results) {ctx.cache = results;}});
  },

  refreshCache: function() {
    var skip = this.skip + this.position;
    this._sendQuery(this.collectionName, this.query, this.fields, this.limit, skip);
    return this.cache.empty() ? false : true;
  },

  iterate: function() {
    if(this.cache.empty() && !this.refreshCache()) {
      $resetCursor();
      return [];
    }
    else {
      var ctr = 0;
      var results = [];
      while(this.cache.length > 0 && ctr < 10) {
        results.push(this.cache.shift());
        ctr += 1;
        this.position += 1;
      }
      return results;
    }
  },

  next: function() {
    if(this.cache.empty() && !this.refreshCache()) {
      return [];
    }
    else {
      var item = this.cache.shift();
      this.position += 1;
      return item;
    }
  },

  hasNext: function() {
    if(this.cache.empty() && !this.refreshCache())
      return false;
    else
      return true;
  },

  toString: function() {
    return 'DBCursor';
  }
}
