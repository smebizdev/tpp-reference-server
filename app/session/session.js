const uuidv1 = require('uuid/v1'); // Timestamp based UUID
const { store } = require('./persistence.js');
const log = require('debug')('log');

const session = (() => {
  const setId = (sid, username) => store.set(sid, JSON.stringify({ sid, username }));
  const getId = (sid, cb) => store.get(sid, cb);
  const setAccessToken = accessToken => store.set('ob_directory_access_token', JSON.stringify(accessToken));
  const getAccessToken = cb => store.get('ob_directory_access_token', cb);

  const destroy = (candidate, cb) => {
    const sessHandler = (err, data) => {
      const sid = data && JSON.parse(data).sid;
      log(`in sessHandler sid is ${sid}, candidate:[${candidate}]`);
      if (sid !== candidate) {
        return cb(null);
      }
      store.remove(candidate); // Async but we kinda don't care :-/
      return cb(sid);
    };
    store.get(candidate, sessHandler);
  };

  const newId = (username) => {
    const mySid = uuidv1();
    setId(mySid, username);
    return mySid;
  };

  const deleteAll = async () => {
    await store.deleteAll();
  };

  return {
    setId,
    getId,
    setAccessToken,
    getAccessToken,
    destroy,
    newId,
    deleteAll,
  };
})();

exports.session = session;
