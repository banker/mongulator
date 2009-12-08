var ObjectIdCounter = 0;

var ObjectId = function() {
  this.counter = (ObjectIdCounter += 1);
  this.str     = this.counter;
  this.initialize();
  return this.counter;
};

ObjectId.prototype.initialize = function() {
  return this.counter;
}
