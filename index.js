var Promise = require('bluebird');

function PSemaphore(opts) {
  opts = opts || {};

  this.queue  = [];
  this.rooms  = opts.rooms || 1;
  this.active = [{Promise: {promise: Promise.resolve()}}]
}

PSemaphore.prototype._nextRoom = function() {
  var nextRoom = -1;

  if (this.rooms > this.active.length) {
    nextRoom = this.active.length;
  }

  this.active.forEach(function(v, i) {
    if (v.Promise.promise.isFulfilled() && nextRoom == -1) {
      nextRoom = i;
    }
  });

  return nextRoom;
}

PSemaphore.prototype._processNext = function() {
  // if the queue is empty no need to assign it
  if (this.queue.length == 0) {
    return;
  }

  var openRoom = this._nextRoom();
  if (openRoom != -1) {
    this._assignRoom(openRoom);
  }
}

PSemaphore.prototype._assignRoom = function(room) {
  var worker = this.queue.shift();
  this.active[room] = worker;

  worker()
  .then(function() {
    worker.Promise.resolve();
  }.bind(this))
  .catch(function() {
    worker.Promise.reject();
  }.bind(this))
  .finally(function() {
    this._processNext();
  }.bind(this));
};

PSemaphore.prototype.add = function(work) {
  work.Promise = Promise.pending();
  this.queue.push(work);

  this._processNext();
  return work.Promise.promise;
};


module.exports = PSemaphore
