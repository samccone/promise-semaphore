<h2 align="center"> promise-semaphore</h2>
<p align="center"><b>npm i promise-semaphore</b></p>
<p align="center">
  <a title='Build Status' href="https://travis-ci.org/samccone/promise-semaphore">
    <img src='https://travis-ci.org/samccone/promise-semaphore.svg' />
  </a>
</p>

__promise-semaphore__ is for when you want to push a set of work to be done in a configurable serial fashion.

Each item added is individually resolvable via a `then` chained onto the add method.

```js
var PSemaphore = require('promise-semaphore');
var pSemaphore = new PSemaphore();

pSemaphore.add(function() {
  return Promise.resolve();
}).then(function(){ console.log("job 1 done")})

pSemaphore.add(function() {
  return Promise.resolve();
}).then(function(){ console.log("job 2 done")})
```

You can configure the number of parallel workers via the rooms option.

### Configuration

```js
new PSemaphore({
  rooms: 4
})
```

_ensure your rooms are >= 1, otherwise no work will ever get done!_

### Evented Interface

PromiseSemaphore emits events to help you debug and hook into life cycle events.

* __workDone__ is emitted when there are no more tasks in the work queue and all work has been completed.

```js
ps.on('workDone', function(){});
```

* __workAdded__ is emitted when a new task is added.

```js
ps.on('workAdded', function(){});
```

* __roomAssigned__ is emitted when a task is assigned to a room. The emitter emits the room that was assigned. (note: rooms are 0 indexed)

```js
ps.on('roomAssigned', function(room){});
```

* __roomFound__ is emitted when a room index has been looked up. If the no open rooms are found a room of -1 is emitted. (note: rooms are 0 indexed)

```js
ps.on('roomFound', function(room){});
```

#### New to semaphores?

> Library analogy
Suppose a library has 10 identical study rooms, to be used by one student at a time. To prevent disputes, students must request a room from the front desk if they wish to make use of a study room. If no rooms are free, students wait at the desk until someone relinquishes a room. When a student has finished using a room, the student must return to the desk and indicate that one room has become free.

> The clerk at the front desk does not keep track of which room is occupied or who is using it, nor does she know if the room is actually being used, only the number of free rooms available, which she only knows correctly if all of the students actually use their room and return them when they're done. When a student requests a room, the clerk decreases this number. When a student releases a room, the clerk increases this number. Once access to a room is granted, the room can be used for as long as desired, and so it is not possible to book rooms ahead of time.

> In this scenario the front desk count-holder represents a semaphore, the rooms are the resources, and the students represent processes. The value of the semaphore in this scenario is initially 10. When a student requests a room she is granted access and the value of the semaphore is changed to 9. After the next student comes, it drops to 8, then 7 and so on. If someone requests a room and the resulting value of the semaphore would be negative,[2] they are forced to wait until a room is freed (and the count is increased from 0).
