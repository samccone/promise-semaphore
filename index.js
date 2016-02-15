var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var util = require('util')

// pending ponyfill
// http://bluebirdjs.com/docs/api/deferred-migration.html
Promise.pending = function() {
  ret = {};

  ret.promise = new Promise(function(res, rej) {
    ret.resolve = res;
    ret.reject = rej;
  });

  return ret;
};

function PSemaphore(opts) {
  opts = opts || {};

  this.queue  = [];
  this.rooms  = opts.rooms || 1;
  this.active = [{Promise: {promise: Promise.resolve()}}]
}

util.inherits(PSemaphore, EventEmitter);

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

  this.emit('roomFound', nextRoom);

  return nextRoom;
}

PSemaphore.prototype._processNext = function() {
  // if the queue is empty no need to assign it
  if (this.queue.length == 0) {
    this.emit('workDone');
    return;
  }

  var openRoom = this._nextRoom();
  if (openRoom != -1) {
    this._assignRoom(openRoom);
  }
}

PSemaphore.prototype._assignRoom = function(room) {
  this.emit('roomAssigned', room);
  var worker = this.queue.shift();
  this.active[room] = worker;

  // not calling worker() directly here has the advantage that worker()
  // does not necessarily have to return a bluebird-style Promise,
  // or even a Promise instance at all
  Promise.resolve()
  .then(worker)
  .then(function(v) {
    worker.Promise.resolve(v);
  }.bind(this))
  .catch(function(e) {
    worker.Promise.reject(e);
  }.bind(this))
  .finally(function() {
    setImmediate(function(){
      this._processNext();
    }.bind(this))
  }.bind(this));
};

PSemaphore.prototype.add = function(work) {
  this.emit('workAdded');
  work.Promise = Promise.pending();
  this.queue.push(work);

  this._processNext();
  return work.Promise.promise;
};

module.exports = PSemaphore
