'use strict';

// Articles routes use loci controller
var strains = require('../controllers/strains');
/*
var authorization = require('./middlewares/authorization');

// Article authorization helpers
var hasAuthorization = function(req, res, next) {
	if (req.locus.user.id !== req.user.id) {
        return res.send(401, 'User is not authorized');
    }
    next();
};
*/

module.exports = function(app, auth, database) {
    app.get('/crispr/strains', strains.all);
};
