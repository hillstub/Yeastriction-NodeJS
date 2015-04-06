'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Locus = mongoose.model('Locus'),
    Strain = mongoose.model('Strain'),
    LineByLineReader = require('line-by-line'),
    _ = require('lodash');


/**
 * Find locus by id
 */
exports.locus = function(req, res, next, id) {
    Locus.load(id, function(err, locus) {
        if (err) return next(err);
        if (!locus) return next(new Error('Failed to load locus ' + id));
        req.locus = locus;
        next();
    });
};

/**
 * Create an locus
 */
exports.create = function(req, res) {
    var locus = new Locus(req.body);

    locus.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                locus: locus
            });
        } else {
            res.jsonp(locus);
        }
    });
};

/**
 * Update an locus
 */
exports.update = function(req, res) {
    var locus = req.locus;

    locus = _.extend(locus, req.body);
    locus.targets_cache = []; //We need to reload the targets
    locus.diagnostic_primers_cache = []; //and the diagnostic primers
    locus.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                locus: locus
            });
        } else {
            res.jsonp(locus);
        }
    });
};

/**
 * Delete an locus
 */
exports.destroy = function(req, res) {
    var locus = req.locus;

    locus.remove(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                locus: locus
            });
        } else {
            res.jsonp(locus);
        }
    });
};

exports.importLoci = function(req, res) {
    var strain_name = req.params.strain_name;
    var fs = require('fs');
    var path = require('path');
    //First try to find the strain
    Strain.findOne({
        name: strain_name
    }, function(err, strain) {
        if (err) {
            console.log(err);
        } else {
            //It's not present in the database, so create a new one
            if (!strain) {
                strain = new Strain({
                    name: strain_name
                });
                strain.save(function(err) {
                    if (err) {
                        console.log('ERR', err);
                    } else {
                        console.log(strain);
                    }
                });
            }
            var symbols = [];
            var symbols_non_unique = [];
            console.time('importLoci');
            //Remove loci that are already associated with the (existing) strain
            Locus.find({
                strain: strain
            }).remove(function(err) {
                var lr = new LineByLineReader(path.join(process.env.GENOMES_DIR, strain_name + '.tab'));
                lr.on('line', function(line) {
                    line = line.split('\t');
                    //YAL001C   TFC3       1001    4574    ACTTGTAAAT...
                    //0         1          2       3       4
                    var locus = new Locus({
                        orf: line[0],
                        strain: strain._id,
                        sequence: line[4],
                        start_orf: line[2] - 1,
                        end_orf: line[3] //no minus one, so these values is now compatible with sequence.substring(start_orf,end_orf) giving the whole ORF
                    });
                    if (line[1]) {
                        locus.symbol = line[1];
                        if (symbols.indexOf(line[1]) > -1) {
                            symbols_non_unique.push(line[1]);
                        } else {
                            symbols.push(line[1]);
                        }
                    }
                    locus.save(function(err, item) {
                        if (err) {
                            console.error('Locus error', '\'' + line[1] + '\'', locus.symbol);
                        }
                    });
                });
                lr.on('end', function(line) {
                    console.log(line);
                    Locus.update({
                        strain: strain,
                        symbol: {
                            $in: symbols_non_unique
                        }
                    }, {
                        $set: {
                            symbol: null
                        }
                    }, {
                        multi: true
                    }, function(err) {
                        console.log(err);
                        console.log('close file', symbols_non_unique);
                        console.timeEnd('importLoci');
                    });
                });
                return res.send('close file');
            });
        }
    });
};

/**
 * Show an locus
 */
exports.show = function(req, res) {
    res.jsonp(req.locus.toJSON({
        virtuals: true
    }));
};

exports.one = function(req, res) {
    var args = {
        virtuals: true
    };
    var query = {};
    if (req.query && req.query.locus) {
        query.strain = req.query.strain;
        if (req.query.locus.match(/^Y[A-Z]{2}\d{3}[WC].*/) || req.query.locus.match(/Q\d{4}/)) {
            query.orf = req.query.locus;
        } else {
            query.symbol = req.query.locus;
        }
    }

    Locus.findOne(query).populate('strain').exec(function(err, el) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            if (el === null) {
                return res.jsonp({});
            }
            Strain.findOne({
                'name': 'S288C'
            }, function(err, S288C) {
                Locus.findOne({
                    'orf': el.orf,
                    strain: S288C.id
                }, function(err, S288C_orf) {
                    var obj = el.toJSON(args);
                    obj.error_msg = [];
                    if (!err && S288C_orf) {
                        var diff_length = (S288C_orf.end_orf - S288C_orf.start_orf) - (el.end_orf - el.start_orf);
                        if(diff_length < 0){
                            obj.error_msg.push('The length of the ORF is '+(-diff_length)+' nucleotides larger than it\'s ORF in S288C.');
                        }else if(diff_length > 0){
                            obj.error_msg.push('The length of the ORF is '+(diff_length)+' nucleotides smaller than it\'s ORF in S288C.');
                        }
                     //   console.log("S288C_orf", S288C_orf);
                    } else {
                       obj.error_msg.push('Couldn\'t find this ORF in the S288C genome');
                    }
                    if(obj.sequence.substring(obj.start_orf, obj.end_orf).indexOf('N') > -1){
                        obj.error_msg.push('The ORF sequence contains N as a nucleotide.');
                    }
                    el.getTargets(function(targets) {
                        obj.targets = targets;
                        el.getDiagnosticPrimers(function(diagnostic_primers) {
                            obj.diagnostic_primers = diagnostic_primers;
                            return res.jsonp(obj);
                        });
                    });
                });
            });

        }
    });
};
/**
 * List of Locuss
 */
exports.all = function(req, res) {
    var query = {};
    var args = {};
    if (req.query && req.query.loci) {
        var loci = req.query.loci instanceof Array ? req.query.loci : [req.query.loci];
        query = {
            $or: [{
                'orf': {
                    $in: loci
                }
            }, {
                'symbol': {
                    $in: loci
                }
            }],
            'strain': req.query.strain
        };
        args = {
            virtuals: true
        };
    }
    Locus.find(query).populate('strain').sort('symbol').exec(function(err, loci) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            var docs = [];
            var i = 0;
            if (loci.length === 0) {
                return res.jsonp([]);
            }
            _.each(loci, function(el) {
                var obj = el.toJSON(args);
                el.getTargets(function(targets) {
                    obj.targets = targets;
                    el.getDiagnosticPrimers(function(diagnostic_primers) {
                        obj.diagnostic_primers = diagnostic_primers;
                        docs.push(obj);
                        i++;
                        if (i === loci.length) {
                            _.each(docs, function(doc) {
                                console.log(doc.symbol);
                            });
                            return res.jsonp(docs);
                        }
                    });
                });
            });
        }
    });
};
