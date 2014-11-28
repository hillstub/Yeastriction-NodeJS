'use strict';

// Articles routes use loci controller
var loci = require('../controllers/loci');
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
    //      app.get('/crispr/import/remaining', loci.importRemainingLoci);
    app.get('/crispr/import/:strain_name/:remaining?', loci.importLoci);
    app.get('/crispr/loci', loci.all);
    app.post('/crispr/loci', /*authorization.requiresLogin,*/ loci.create);
    app.get('/crispr/loci/:locusId', loci.show);
    app.put('/crispr/loci/:locusId', /*authorization.requiresLogin, hasAuthorization,*/ loci.update);
    app.del('/crispr/loci/:locusId', /*authorization.requiresLogin, hasAuthorization, */ loci.destroy);

    // Finish with setting up the locusId param
    app.param('locusId', loci.locus);

};
