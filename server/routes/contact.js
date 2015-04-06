'use strict';

var contact = require('../controllers/contact');

module.exports = function(app) {
    var index = require('../controllers/index');
    app.post('/contact', contact.response);

};