const { session } = require('./session');

const validSession = (candidate, callback) => {
  session.getId(candidate, (err, sid) => {
    if (sid === candidate) {
      return callback(true);
    }
    return callback(false);
  });
};

const requireAuthorization = (req, res, next) => {
  const sid = req.headers.authorization;
  if (sid) {
    validSession(sid, (valid) => {
      if (!valid) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(401).send();
      } else {
        next();
      }
    });
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(401).send();
  }
};

exports.requireAuthorization = requireAuthorization;
