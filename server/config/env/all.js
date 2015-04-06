'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {
    root: rootPath,
    port: process.env.PORT || 3000,
    db: process.env.MONGOHQ_URL,
    recaptcha_public_key: process.env.RECAPTCHA_PUBLIC_KEY,
    recaptcha_private_key: process.env.RECAPTCHA_PRIVATE_KEY,
    mailgun_key: process.env.MAILGUN_KEY,
    mailgun_from: process.env.MAILGUN_FROM,
    mailgun_to: process.env.MAILGUN_TO,
    templateEngine: 'swig',

    // The secret should be set to a non-guessable string that
    // is used to compute a session hash
    sessionSecret: 'MEAN',
    // The name of the MongoDB collection to store sessions in
    sessionCollection: 'sessions'
};
