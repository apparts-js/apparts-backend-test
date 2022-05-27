const bodyParser = require("body-parser");
const { connect } = require("@apparts/db");

let DB_CONFIG = null;
let dbs = undefined;
const getDBPool = (next) => {
  if (dbs === undefined) {
    dbs = connect(DB_CONFIG);
    dbs
      .then((newDbs) => {
        dbs = newDbs;
        next(dbs);
      })
      .catch((e) => {
        /* istanbul ignore next */ /* eslint-disable-next-line no-restricted-globals */
        console.log("DBS Error");
        console.log(e);
        dbs = null;
        throw e;
      });
  } else if (dbs instanceof Promise) {
    dbs.finally(() => {
      getDBPool(next);
    });
  } else {
    /* istanbul ignore next */
    next(dbs);
  }
};

const injectDB = (req, res, next) => {
  getDBPool((dbs) => {
    req.dbs = dbs;
    next();
  });
};

const applyMiddleware = (route, dbConfig) => {
  DB_CONFIG = dbConfig;
  route.use(bodyParser.json());
  route.use(injectDB);
};

module.exports = applyMiddleware;
module.exports.shutdown = () => {
  if (dbs) {
    return new Promise((res) => {
      dbs.shutdown(() => {
        dbs = undefined;
        res();
      });
    });
  }

  return Promise.resolve();
};
