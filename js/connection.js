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

  insert: function() {
    console.log('inserted');
  },

  update: function() {
    console.log('updated');
  },

  remove: function() {
    console.log('remove');
  }

};
