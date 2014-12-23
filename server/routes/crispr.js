'use strict';


// crispr routes use crispr controller
//var crispr = require('../controllers/crispr');
var authorization = require('./middlewares/authorization');

// Article authorization helpers
var hasAuthorization = function(req, res, next) {
   // if (req.crispr.user.id !== req.user.id) {
        return res.send(401, 'User is not authorized');
 //   }
    //next();
};

module.exports = function(app) {
    var index = require('../controllers/index');
    app.get('/crispr/example/render', index.render);
    /*
    app.get('/crispr', crispr.all);
    app.post('/crispr', authorization.requiresLogin, crispr.create);
    app.get('/crispr/:articleId', crispr.show);
    app.put('/crispr/:articleId', authorization.requiresLogin, hasAuthorization, crispr.update);
    app.del('/crispr/:articleId', authorization.requiresLogin, hasAuthorization, crispr.destroy);
*/
};


// The Package is past automatically as first parameter
/*
module.exports = function(app, auth, database) {

    app.get('/crispr/example/anyone', function(req, res, next) {
        res.send('Anyone can access this');
    });

    app.get('/crispr/example/auth', auth.requiresLogin, function(req, res, next) {
        res.send('Only authenticated users can access this');
    });

    app.get('/crispr/example/admin', auth.requiresAdmin, function(req, res, next) {
        res.send('Only users with Admin role can access this');
    });

    app.get('/crispr/example/render', function(req, res, next) {
        Crispr.render('index', {
            package: 'crispr'
        }, function(err, html) {
            //Rendering a view from the Package server/views
            res.send(html);
        });
    });
};
*/