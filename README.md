# Fabricate and delete your data on integration testing.

## What's it?
`db-fabricator` is a simple node.js module that can create, update and delete data and also manipulate created and updated data during sessions.

## Simple Example

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

*NOTE:* Defaults for database connection are:
```
{
  host: 'localhost',
  user: 'root',
  password: ''
}
```
