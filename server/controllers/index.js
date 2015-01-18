'use strict';

//var mean = require('meanio');

exports.render = function(req, res) {

 /*   var modules = [];

    // Preparing angular modules list with dependencies
    for (var name in mean.modules) {
        modules.push({
            name: name,
            module: 'mean.' + name,
            angularDependencies: mean.modules[name].angularDependencies
        });
    }*/

    // Send some basic starting info to the view
    res.render('index', {
        user: req.user ? JSON.stringify({
            name: req.user.name,
            _id: req.user._id,
            username: req.user.username,
            roles: (req.user ? req.user.roles : ['anonymous']),
            restriction_enzymes: req.user.restriction_enzymes,
            crispr_method: req.user.crispr_method,
            default_strain: (req.user.default_strain ? req.user.default_strain : null),
            show_diagnostic_primers: req.user.show_diagnostic_primers,
            ranking_restriction_sites: req.user.ranking_restriction_sites,
            ranking_gc_content: req.user.ranking_gc_content,
            ranking_secondary_structure: req.user.ranking_secondary_structure
        }) : 'null',
        modules: [] //[JSON.stringify(modules)]
    });
};
