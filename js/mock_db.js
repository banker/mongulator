/*
TryMongo
Author: Kyle Banker (http://www.kylebanker.com)
Date: September 1, 2009
 
(c) Creative Commons 2009
http://creativecommons.org/licenses/by-sa/2.5/
*/

// Technique for extending the Array objects.
// see http://dean.edwards.name/weblog/2006/11/hooray/
var iframe = document.createElement("iframe");
iframe.style.display = "none";
document.body.appendChild(iframe);
frames[frames.length - 1].document.write(
  "<script>parent.DBCollection = Array;<\/script>"
);

// Generic database collection class.
DBCollection.prototype.save = function() {
  if(arguments.length == 0 || !(arguments[0] instanceof Object)) {
    return "DB Error: Must pass an object to save"
  }
  if(arguments[0]) {
    this.push(arguments[0]);
    return 'ok';
  }
}

DBCollection.prototype.find = function() {
  if(arguments.length == 0) {
    return CollectionInspect(this);
  }
}
