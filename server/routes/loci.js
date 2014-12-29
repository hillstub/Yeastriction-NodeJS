'use strict';

// Loci routes use loci controller
var loci = require('../controllers/loci');

var authorization = require('./middlewares/authorization');

// Loci authorization helpers
var hasAuthorization = function(req, res, next) {
	if (!req.user.hasRole('admin')) {
        return res.send(401, 'User is not authorized');
    }
    next();
};




module.exports = function(app, auth, database) {
    app.get('/crispr/import/:strain_name/:remaining?', authorization.requiresLogin, hasAuthorization, loci.importLoci);
    app.get('/crispr/locus', loci.one);

    //app.get('/crispr/loci', loci.all);
    //app.post('/crispr/loci', /*authorization.requiresLogin,*/ loci.create);
    //app.get('/crispr/loci/:locusId', loci.show);
    //app.put('/crispr/loci/:locusId', /*authorization.requiresLogin, hasAuthorization,*/ loci.update);
    //app.del('/crispr/loci/:locusId', /*authorization.requiresLogin, hasAuthorization, */ loci.destroy);

    // Finish with setting up the locusId param
    app.param('locusId', loci.locus);

};
