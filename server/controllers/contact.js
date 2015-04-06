'use strict';

/**
 * Module dependencies.
 */
var Recaptcha = require('no-captcha');
var Mailgun = require('mailgun').Mailgun;
var config = require('../config/config');

exports.response = function(req, res) {
    var data = {
        remoteip: req.connection.remoteAddress,
        response: req.body.response
    };
    var recaptcha = new Recaptcha(config.recaptcha_public_key, config.recaptcha_private_key);
    recaptcha.verify(data, function(err, resp) {
        if (err === null) {
            var mg = new Mailgun(config.mailgun_key);
            mg.sendText(config.mailgun_from, [config.mailgun_to],
                'Yeastriction contact form',
                'E-mail: ' + req.body.email + '\n' +
                'Message: ' + req.body.message,
                function(err) {
                    console.log(err);
                });
            res.send('Thank you, we will reply as soon as possible.');

        } else {
            res.status(500).send('Something went wrong while trying to send your message, please try again.');
        }
    });
};
