const bodyParser = require("body-parser");
const { connect } = require("@apparts/db");

let DB_CONFIG = null;
let dbs = undefined;
const getDBPool = (next) => {
  if (dbs === undefined) {
    connect(DB_CONFIG, (e, newDbs) => {
      if (e) {
        /* istanbul ignore next */
        console.log("DB ERROR");
        console.log(e);
        throw e;
      }
      dbs = newDbs;
      next(dbs);
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
