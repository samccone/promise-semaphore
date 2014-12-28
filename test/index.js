var chai           = require("chai");
var chaiAsPromised = require("chai-as-promised");
var PSemaphore     = require("../");
var Promise        = require("bluebird");
var _              = require('lodash');

chai.should();
chai.use(chaiAsPromised);

describe("default semapore", function() {
  beforeEach(function() {
    this.semapore = new PSemaphore()
  });

  it("returns a promise", function() {
    this.semapore.add(Promise.delay.bind(this, 1)).should.be.defined;
  });

  it("resolves a single item", function(done) {
    this.semapore.add(Promise.delay.bind(this, 1)).then(done)
  });

  it("returns the work value", function(done) {
    this.semapore.add(function() {
      return Promise.delay(20).then(function() {
        return "hi mom";
      })
    }).then(function(v) {
      v.should.eql('hi mom');
      done();
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

  it("resolves a single item", function(done) {
    this.semapore.add(function() {
      return Promise.delay(1);
    }).then(done)
  });

  it("fills all rooms with items", function(done) {
    _.times(2, function() {
      this.semapore.add(Promise.delay.bind(this, 100));
    }, this);

    this.semapore.add(Promise.delay.bind(this, 100))
    .then(done)
  });

  it("handles more jobs then rooms", function(done) {
    _.times(5, function() {
      this.semapore.add(Promise.delay.bind(this, 100));
    }, this);

    this.semapore.add(Promise.delay.bind(this, 100))
    .then(done)
  });
});
