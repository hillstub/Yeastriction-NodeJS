'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Strain = mongoose.model('Strain');


/**
 * Find locus by id

exports.locus = function(req, res, next, id) {
    Locus.load(id, function(err, locus) {
        if (err) return next(err);
        if (!locus) return next(new Error('Failed to load locus ' + id));
        req.locus = locus; 
        next();
    });
};
 */
/**
 * List of Loci
 */
exports.all = function(req, res) {
    Strain.find().exec(function(err, strains) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(strains);
        }
    });
};
