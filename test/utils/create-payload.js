const createAppId = require('./create-app-id');

module.exports = (baseSha, headSha) => {
  return {
    installation: { id: createAppId() },
    pull_request: { // eslint-disable-line camelcase
      base: { sha: baseSha },
      head: { sha: headSha }
    }
  };
};
