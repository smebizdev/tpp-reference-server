const port = process.env.TPP_REF_SERVER_PORT || 8003;
const { app } = require('./app');
const log = require('debug')('log');

app.listen(port, '0.0.0.0');

log(` App listening on port ${port}`);
