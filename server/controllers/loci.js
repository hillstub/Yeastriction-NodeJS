'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Locus = mongoose.model('Locus'),
    Strain = mongoose.model('Strain'),
    _ = require('lodash'),
    url = require('url'),
    utilities = require('../utilities'),
    sh = require('execSync');


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
    var remaining = (req.params.remaining == 'remaining');
    var strain_name = req.params.strain_name;
    var fs = require('fs');
    var readline = require('readline');
    var stream = require('stream');
    var path = require('path');
    console.log('importLoci');
    //First remove the strain (and associated loci) from the database
    Strain.findOne({
        name: strain_name
    }, function(err, strain) {
        if (err) {
            console.log(err);
        } else {
            if (!remaining) {
                console.log("gaan we even verwijderen");
                if (strain) {
                    strain.remove();
                }
                var strain = new Strain({
                    name: strain_name
                });
                strain.save(function(err) {
                    if (err) {
                        console.log("ERR", err);
                    } else {
                        console.log(strain);
                    }
                });
            } else {
                console.log("importRemaining2");
            }
            var instream = fs.createReadStream(path.join(process.env.GENOMES_DIR,  strain_name + '.tab'));
            var outstream = new stream;
            var rl = readline.createInterface(instream, outstream);
            rl.on('line', function(line) {
                var line = line.split('\t');
                Locus.findOne({
                    orf: line[0],
                    strain: strain._id
                }, function(err, found) {
                    if (err) {
                        console.log(err)
                    };
                    if (!found) {
                        //    console.log("didn't find" + line[0]);
                        //YAL001C   TFC3       1000    4573    ACTTGTAAAT...
                        //0         1          2       3       4
                        var locus = new Locus({
                            orf: line[0],
                            symbol: line[1],
                            strain: strain._id,
                            sequence: line[4],
                            start_orf: line[2],
                            end_orf: line[3]
                        });




                        locus.save(function(err, item) {
                            if (err) {
                                console.error("Locus save", err);
                            }
                            Locus.findOne(item).populate('strain').exec(function(err, item) {
                                if (err) {
                                    console.error("Locus find", err);
                                }
                             /*   item.getTargets(function(targets) {

                                });
                                //to trigger calculating the targets
                                /*  item.toJSON({
                                     virtuals: true
                                 });*/
                            });
                        });

                    } else {
                        console.log("found one");
                    }

                });

            });

            rl.on('close', function() {
                console.log("close file");

                // do something on finish here
            });
            return res.send("close file");
        }
    });


}

/**
 * Show an locus
 */
exports.show = function(req, res) {
    res.jsonp(req.locus.toJSON({
        virtuals: true
    }));
};

exports.one = function(req, res){
    console.log("exports.one",req.query);
    var query = {};
    var args = {};
    if (req.query && req.query.locus) {
        query = {
            $or: [{
                'orf': req.query.locus
            }, {
                'symbol': req.query.locus
            }],
            'strain': req.query.strain
        };
        args = {
            virtuals: true
        };
    }
    Locus.findOne(query).populate('strain').exec(function(err, el) {
        if (err) {
            console.log(err);
            res.render('error', {
                status: 500
            });
        } else {
            if(el === null){
                return res.jsonp({});
            }
            var obj = el.toJSON(args);
            el.getTargets(function(targets) {
                obj.targets = targets;
                el.getDiagnosticPrimers(function(diagnostic_primers) {
                    obj.diagnostic_primers = diagnostic_primers;
                    return res.jsonp(obj);
                });
            });
        }
    });    
}
/**
 * List of Locuss
 */
exports.all = function(req, res) {
    console.log("exports.all");
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
            console.log(err);
            res.render('error', {
                status: 500
            });
        } else {
            var docs = [];
            var i = 0;
            if(loci.length == 0){
                return res.jsonp([]);
            }
            _.each(loci, function(el) {
                var obj = el.toJSON(args);
                console.log(el.orf, "getting targets1");
                el.getTargets(function(targets) {
                    console.log(el.orf, "getting targets2");
                    obj.targets = targets;
                    el.getDiagnosticPrimers(function(diagnostic_primers) {
                        console.log("getting diagnostic_primers");
                        obj.diagnostic_primers = diagnostic_primers;
                        docs.push(obj);
                        i++;
                        if (i == loci.length) {
                            console.log("loci.length", loci.length);
                            console.log("i", i);
                            console.log(docs.length);
                            _.each(docs, function(doc){
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
