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
    this.semapore.add(function() {
      return Promise.delay(1);
    }).then(done)
  });

  it("resolves multiple items added sequentially", function(done) {
    this.semapore.add(function() {
      return Promise.delay(20);
    })

    this.semapore.add(function() {
      return Promise.delay(20);
    })

    this.semapore.add(function() {
      return Promise.delay(20);
    }).then(done)

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
      this.semapore.add(function() {
        return Promise.delay(100);
      })
    }, this);

    this.semapore.add(function() {
      return Promise.delay(100);
    }).then(done)
  });

  it("handles more jobs then rooms", function(done) {
    _.times(5, function() {
      this.semapore.add(function() {
        return Promise.delay(100);
      })
    }, this);

    this.semapore.add(function() {
      return Promise.delay(100);
    }).then(done)
  });
});
