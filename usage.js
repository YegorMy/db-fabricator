const fab = require('./src/');
const Promise = require('bluebird');

const MySQLAdapter = fab.MySQLAdapter;
const Fabricator = new fab.Fabricator(new MySQLAdapter({
  database: 'TestDatabase',
}));
Fabricator.startSession();

Promise.all([
  Fabricator.update('TestTable', {
    name: 'lol'
  }, {
    id: 1
  }),
  Fabricator.create('TestTable', {
    name: 'Test name',
  })
]).then((data) => {
  return Fabricator.adapter.select('TestTable', '', {id: 1});
}).then(data => {
  console.log(data);
  Fabricator.stopSession().then(() => {
    console.log(Fabricator.sessionData);
  });
})