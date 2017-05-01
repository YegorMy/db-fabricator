const BBPromise = require('bluebird');

class TemplateHelper {
  constructor (table, data, createFn) {
    return (dataToUpdate = {}) => {
      const pureData = {};
      const executableData = {};
      const promiseData = [];
      const promiseQueue = [];

      for (const key in dataToUpdate) {
        data[key] = dataToUpdate[key];
      }

      for (const key in data) {
        const value = data[key];

        if (typeof value === 'function') {
          executableData[key] = value;
        } else {
          pureData[key] = value;
        }
      }

      for (const key in executableData) {
        const result = executableData[key].apply(null, [pureData]);

        if (result instanceof Promise || result instanceof BBPromise) {
          promiseData.push(key);
          promiseQueue.push(result);

          continue;
        }

        data[key] = result;
      }

      return BBPromise.all(promiseQueue).then(result => {
        for (const index in result) {
          const dataKey = promiseData[index];
          const dataFromPromise = result[index];

          data[dataKey] = dataFromPromise;
        }

        return createFn(table, data);
      });
    }
  }
}

module.exports = TemplateHelper;