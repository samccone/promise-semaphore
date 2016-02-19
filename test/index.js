var chai           = require("chai");
var chaiAsPromised = require("chai-as-promised");
var PSemaphore     = require("../");
var Promise        = require("bluebird");
var _              = require('lodash');

chai.should();
chai.use(chaiAsPromised);

describe("multiqueue", function() {
  it("handles nested queues when rooms === to depth", function() {
    var queue = new PSemaphore({
      rooms: 2
    });

    var bar = function() {
      return queue.add(function(){})
    };

    return queue.add(function() {
      return bar()
    });
  });
});

describe("default semapore", function() {
  beforeEach(function() {
    this.semapore = new PSemaphore()
  });

  it("returns a promise", function() {
    this.semapore.add(Promise.delay.bind(this, 1)).should.be.defined;
  });

  it("resolves a single item", function() {
    return this.semapore.add(Promise.delay.bind(this, 1));
  });

  if (typeof global.Promise !== 'undefined') {
    it("works with ES6 Promise instances", function() {
      // essentially the README example
      return this.semapore.add(function() {
        return global.Promise.resolve();
      });
    });
  }

  it("returns the work value", function() {
    return this.semapore.add(function() {
      return Promise.delay(20).then(function() {
        return "hi mom";
      })
    }).then(function(v) {
      v.should.eql('hi mom');
    });
  });

  it("returns the work value when used in non-promise fashion", function() {
    return this.semapore.add(function() {
      return "hi mom";
    }).then(function(v) {
      v.should.eql('hi mom');
    });
  });

  it("returns the thrown error", function(done) {
    this.semapore.add(function() {
      return Promise.delay(20).then(function() {
        throw new Error("bye mom");
      })
    }).catch(function(e) {
      e.message.should.eql('bye mom');
      done();
    });
  });

  it("resolves multiple items added sequentially", function(done) {
    this.semapore.add(Promise.delay.bind(this, 20))
    this.semapore.add(Promise.delay.bind(this, 20))
    this.semapore.add(Promise.delay.bind(this, 20))
    .then(done)
  });

  describe("event emitting", function() {
    it("emits when work it added", function(done) {
      this.semapore.on('workAdded', function() {
        done();
      });

      this.semapore.add(Promise.resolve);
    });

    it("emits when a room is assigned", function(done) {
      this.semapore.on('roomAssigned', function(room) {
        room.should.eql(0);
        done();
      });

      this.semapore.add(Promise.resolve);
    });

    it("emits when a room is found", function(done) {
      this.semapore.on('roomFound', function(room) {
        room.should.eql(0);
        done();
      });

      this.semapore.add(Promise.resolve);
    });

    it("emits when all work is done", function(done) {
      this.semapore.on('workDone', function() {
        done();
      });

      this.semapore.add(Promise.delay.bind(this, 20));
      this.semapore.add(Promise.delay.bind(this, 20));
      this.semapore.add(Promise.delay.bind(this, 20));
    });
  });
})

describe("multiroom semapore", function() {
  beforeEach(function() {
    this.semapore = new PSemaphore({rooms: 3});
  });

  it("resolves a single item", function() {
    return this.semapore.add(function() {
      return Promise.delay(1);
    })
  });

  it("fills all rooms with items", function() {
    _.times(2, function() {
      this.semapore.add(Promise.delay.bind(this, 100));
    }, this);

    return this.semapore.add(Promise.delay.bind(this, 100))
  });

  it("handles more jobs than rooms", function() {
    _.times(5, function() {
      this.semapore.add(Promise.delay.bind(this, 100));
    }, this);

    return this.semapore.add(Promise.delay.bind(this, 100))
  });
});
