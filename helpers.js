const { connect } = require("@apparts/db");

const error = (error, description) =>
  description ? { error, description } : { error };

const url = (api) => (postfix, query) => {
  let queryparams = "";
  if (query) {
    queryparams =
      "?" +
      Object.keys(query)
        .map((key) => `${key}=${query[key]}`)
        .join("&");
  }
  return `/v/${api}/${postfix}${queryparams}`;
};

const runDBQuery = (DB_CONFIG) => async (queryRunner) => {
  const dbs = await new Promise((res, rej) => {
    connect(DB_CONFIG, (e, dbs) => {
      if (e) {
        console.log(e);
        rej(e);
      }
      res(dbs);
    });
  });
  const result = await queryRunner(dbs);
  await new Promise((res) => {
    dbs.shutdown(() => {
      res();
    });
  });
  return result;
};

const pSetupquery = async (databasePreparations) => {
  let query = "";
  for (const preparation of databasePreparations) {
    query += await preparation();
  }
  return query;
};

module.exports = { error, url, runDBQuery, pSetupquery };
