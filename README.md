# Fabricate and delete your data on integration testing.

`npm i db-fabricate`

`yarn add db-fabricate`

## Structure
- [What is it?](#what-is-it)
- [Simple Example](#example)
- [Documentation](#docs)
- - [Create](#create)
- - [Start Session](#start-session)
- - [Stop Session](#stop-session)
- - [Update](#update)
- - [Select](#select)
- - [Remove](#remove)
- - [Close Connection](#close-connection)
- - [Constraints](#constraints)

## <a name="what-is-it"></a> What's it?
`db-fabricator` is a simple node.js module that can create, update and delete data and also manipulate created and updated data during sessions.

## <a name="example"></a> Simple Example

```javascript
const fab = require('db-fabricate');
const MySQLAdapter = fab.MySQLAdapter;
const Fabricator = new fab.Fabricator(new MySQLAdapter({database: 'TestDatabase'})); // CHANGE YOUR DB CREDENTIALS HERE

Fabricator.startSession();

Fabricator.create('TestTable', {
  name: '123'
}).then((id) => {
  // here we have element we have created.
  return Fabricator.stopSession();
}).then(() => {
  // stop session killed all created elements during the session.
  Fabricator.closeConnection();
});
```

**NOTE:** Defaults for database connection are:
```
{
  host: 'localhost',
  user: 'root',
  password: ''
}
```

So you can easily create integration tests with on-the-go data and simply remove it after creation.

# <a name="#docs"></a> Documentation for methods:

## <a name="#create"></a> Fabricator.create()

Will create new entity in database with passed parameters:

```javascript
Fabricator.create('TestTable', { // will be written into Session 2
  name: '123'
}).then((id) => {
  console.log(id); // id of created entity
});
```

## <a name="#start-session"></a> Fabricator.startSession()

Starts new session for fabricator. You can nest sessions. Data will be recoreded to the latest opened session.
On close session all data created or modified in this session will be restored.
**NOTE:** This works with _insert_, _create_ and _remove_.

```javascript
Fabricator.startSession(); // Session 1
Fabricator.startSession(); // Session 2

Fabricator.create('TestTable', { // will be written into Session 2
  name: '123'
}).then((id) => {
  // do some tests...

  return Fabricator.stopSession(); // element with name 123 will be removed and Session 2 will be closed.
}).then(() => {
  return Fabricator.create('TestTable', { // will be written into Session 1
    name: '321'
  });
}).then(() => {
  return Fabricator.stopSession(); // element with name 321 will be removed. and Session 1 will be closed.
});

```


## <a name="#stop-session"></a> Fabricator.stopSession()

Stops latest opened session.
On close session all data created or modified in this session will be restored.

```javascript
Fabricator.startSession();
Fabricator.closeSession().then(() => {
  console.log('session closed');
});
```

## <a name="#update"></a> Fabricator.update(table, data, constraints)

Updates entity/enitities in `table` with fields and values specified in `data`. Entities will be found by passed constraints.

```javascript
Fabricator.startSession();
Fabricator.update('TestTable', {name: '123'}, {id: 1}).then(() => {
  // do some tests...

  return Fabricator.closeSession();
}).then(() => {
  console.log('session closed');
});
```

## <a name="#select"></a> Fabricator.select(table, filter)

Selects data by given [constraints](#constraints)

```javascript
Fabricator.select('TestTable', {
  id: {
    $gte: 10
  }
}).then(data => {
  // do some tests
});
```

## <a name="#remove"></a> Fabricator.remove(table, data)

Removes data from `table` by passed list of ids (or single id):

```javascript

return Fabricator.remove('TestTable', [1], true).then(() => {
  // do some tests
});
```

**NOTE:** Remove works with sessions. _Added at *1.0.5*_

```javascript
Fabricator.startSession();

Fabricator.select('TestTable', [1]).then(data => {
  console.log(data); // if data exists returns data

  return Fabricator.remove('TestTable', [1], true);
}).then(data => {
  return Fabricator.select('TestTable', [1])
}).then(data => {
  console.log(data); // no data

  return Fabricator.stopSession();
}).then(() => {
  return Fabricator.select('TestTable', [1])
}).then(data => {
  console.log(data); // revert to previous state

  return Fabricator.closeConnection();
})
```

## <a name="#close-connection"></a> Fabricator.closeConnection()

Stops all active sessions and closes connection to current database.

```javascript
Fabricator.closeConnection();
console.log('connection closed');
```

# <a name="constraints"></a> Constraints for `Fabricator.update`

You can create loopback-like constraints or your own by simply passing an SQL WHERE string.
List of avaliable filters:
- `equals` - {id: 1} coverts to `` `id` = 1``
- `$gt` - {id: {$gt: 1}} converts to `` `id` > 1``
- `$gte` - {id: {$gte: 1}} converts to `` `id` >= 1``
- `$lt` - {id: {$lt: 1}} converts to `` `id` < 1``
- `$lte` - {id: {$gt: 1}} converts to `` `id` <= 1``
- `$ne` - {id: {$gt: 1}} converts to `` `id` <> 1``
- `$like` - {id: {$like: `%12%5`}} converts to `` `id` like '%12%5'``
- `$in` - {id: {$in: [1,2,3,4,5]}} converts to `` `id` IN (1,2,3,4,5)``. {id: {$in:[1]}} coverts to `` `id` = 1``
- `$and` - can be nested. {$and: [{id: 1}, {name: '123'}]} converts to ``(`id` = 1 AND `name` = '123')``
- `$or` - can be nexted. {$or: [{id: 1}, {name: '123'}]} converts to ``(`id` = 1 OR `name` = '123')``

## Constraints nesting

```javascript
{
  $or: [{
    name: {
      $like: 'yegor'
    }
  }, {
    lastName: {
      $like: 't%st'
    },
    $and: [{
      jobPosition: 5,
      langs: {
        $in: ['ru', 'en']
      }
    }]
  }],
  id: {
    $in: [1,2,3,4,5]
  }
}
```

Will be converted to:
```sql
((`name` like 'yegor') OR (`lastName` like 't%st' AND ((`jobPosition` = 5 AND `langs` IN ('ru','en'))))) AND `id` IN (1,2,3,4,5)
```
