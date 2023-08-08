const { error, url, runDBQuery, pSetupquery } = require("./helpers");
const jestConfig = require("./jest.config.js");
const defaultTestApp = require("./test-app");
const fs = require("fs");

const { useChecks } = require("@apparts/prep");

const { setup, teardown, getPool } = require("./database");

module.exports = ({
  testApp = defaultTestApp,
  apiContainer,
  prepareEndpoint,
  apiVersion = 1,
  schemas = [],
  databasePreparations = [],
  testName,
}) => {
  try {
    const file = fs.readFileSync("jest.config.js");
    if (!file.toString().match(/@apparts\/backend-test/)) {
      throw new Error("Ups");
    }
  } catch (e) {
    throw new Error(`Please make sure, you include the @apparts/backend-test jest configuration into your project:

Create the file jest.config.js in the root directory of your project:

const jestConfig = require("@apparts/backend-test").getJestConfig();
module.exports = {
  ...jestConfig,
  // additional config
};

Also make sure, in your package.json there is no jest configuration.

    `);
  }

  if (!apiVersion || !testName) {
    throw new Error(
      '"apiVersion" or "testName" missing in @apparts/backend-test',
    );
  }

  const databaseName = apiVersion + "_" + testName;
  const DB_CONFIG = { ...require("@apparts/config").get("db-test-config") };
  DB_CONFIG.postgresql.db = databaseName;

  const app = testApp(DB_CONFIG);

  if (!Array.isArray(databasePreparations)) {
    databasePreparations = [databasePreparations];
  }

  beforeAll(async () => {
    await testApp.shutdown();

    const setupquery = await pSetupquery(databasePreparations);
    try {
      await setup(schemas, setupquery, databaseName);
    } catch (e) {
      console.log("Error in setup:", e);
      throw e;
    }
  }, 60000);

  afterAll(async () => {
    await teardown(databaseName);
    await testApp.shutdown();

    // avoid jest open handle error
    // https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
    await new Promise((resolve) => setTimeout(() => resolve(), 500));
  }, 60000);

  return {
    ...(apiContainer
      ? useChecks(apiContainer, prepareEndpoint)
      : {
          checkType: () => {
            throw new Error(
              "checkType called, but apiContainer undefined. Supply a valid apiContainer to @apparts/backend-test",
            );
          },
          allChecked: () => {
            throw new Error(
              "allChecked called, but apiContainer undefined. Supply a valid apiContainer to @apparts/backend-test",
            );
          },
        }),
    app,
    url: url(apiVersion),
    error,
    runDBQuery: runDBQuery(DB_CONFIG),
    getPool,
  };
};

module.exports.error = error;

module.exports.getJestConfig = () => {
  return jestConfig;
};
