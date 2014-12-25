'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('lodash'),
    utilities = require('../utilities'),
    tmp = require('tmp'),
    fs = require('fs'),
    exec = require('child_process').exec,
    vienna_rna = require('vienna_rna');

/**
 * Locus Schema
 */
var LocusSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    sgd_id: {
        type: String,
        default: '',
        trim: true
    },
    orf: {
        type: String,
        default: '',
        trim: true
    },
    symbol: {
        type: String,
        default: '',
        trim: true
    },
    strain: {
        type: Schema.ObjectId,
        ref: 'Strain'
    },
    sequence: {
        type: String,
        default: '',
        trim: true
    },
    start_orf: { //Position of the first nucleotide of the orf within 'sequence'
        type: Number,
    },
    end_orf: { //Position of the last nucleotide of the orf within 'sequence'
        type: Number,
    },
    diagnostic_primers: {
        forward: String,
        reverse: String
    },
    targets: [{
        rna_fold: {
            d: Number,
            deltaG: Number,
            notation: String,
            score: Number
        },
        position: Number,
        GC_content: Number,
        enzymes: Array,
        sequence_wo_pam: String,
        sequence: String
    }]
});

LocusSchema.method('getDiagnosticPrimers', function(cb) {
    //XXX not an array of course so fix to correct type
    if (this.diagnostic_primers.forward !== undefined) {
        return cb(this.diagnostic_primers);
    }
    var locus = this;
    var ko_locus = this.sequence.substring(0, this.start_orf) + this.sequence.substring(this.end_orf);
    if(ko_locus.length <= 50){
        return cb({forward: '', reverse:''});
    }
    var input_primer3 = 'SEQUENCE_TEMPLATE=' + ko_locus + '\n' + 'PRIMER_TASK=generic\n' + 'PRIMER_PICK_LEFT_PRIMER=1\n' + 'PRIMER_PICK_INTERNAL_OLIGO=0\n' + 'PRIMER_PICK_RIGHT_PRIMER=1\n' + 'PRIMER_NUM_RETURN=1\n' + 'SEQUENCE_PRIMER_PAIR_OK_REGION_LIST=0,' + (this.start_orf - 60) + ',' + (this.start_orf + 60) + ',' + (ko_locus.length - (this.start_orf + 60)) + '\n' + 'PRIMER_PRODUCT_SIZE_RANGE=250-750\n' + 'PRIMER_GC_CLAMP=1\n' + '=';
    exec('echo "' + input_primer3 + '" | primer3_core', function(error, stdout, stderr) {
        var primer3_output = utilities.boulderIOtoJSON(stdout);
        if (primer3_output.PRIMER_LEFT_0_SEQUENCE && primer3_output.PRIMER_RIGHT_0_SEQUENCE) {
            locus.diagnostic_primers = {
                forward: primer3_output.PRIMER_LEFT_0_SEQUENCE,
                reverse: primer3_output.PRIMER_RIGHT_0_SEQUENCE
            };
            locus.save(function(err) {
                return cb(locus.diagnostic_primers);
            });
        }else{
            return cb({forward: '', reverse:''});
        }
    });
});

LocusSchema.method('getTargets', function(cb) {
    if (this.targets instanceof Array && this.targets.length > 0) {
        return cb(this.targets);
    }
    var reg = /([ATGC]{20})([ATGC]GG)/g;
    var targets = [],
        found;
    var orf_sequence = this.sequence.substring(this.start_orf, this.end_orf);

    while ((found = reg.exec(orf_sequence)) !== null) {
        targets.push({
            sequence: found[0],
            sequence_wo_pam: found[1]
        });
        reg.lastIndex = found.index + 1;
    }
    while ((found = reg.exec(utilities.reverse_complement(orf_sequence))) !== null) {
        targets.push({
            sequence: found[0],
            sequence_wo_pam: found[1]
        });
        reg.lastIndex = found.index + 1;
    }

    var variants = [];
    targets = _.filter(targets, function(value, index) {
        return (value.sequence_wo_pam.indexOf('TTTTTT') < 0);
    });
    var nucleotides = ['A', 'T', 'G', 'C'];
    _.each(targets, function(value, index) {
        for (var i = 0; i < 4; i++) {
            variants.push(value.sequence_wo_pam + nucleotides[i] + 'GG');
            variants.push(value.sequence_wo_pam + nucleotides[i] + 'AG');
        }
    });

    var locus = this;
    tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) throw err;
        fs.writeFile(path, variants.join('\n'), function(err){
            if(err){console.log(err);}
            fs.close(fd);
            console.time('bowtie');
            exec('bowtie -k 2 -v 3 '+process.env.GENOMES_DIR + locus.strain.name + ' --suppress 2,3,4,5,6,7,8 -r ' + path + ' 2> /dev/null | uniq -c | awk \'{print $2,$1}\'', function(error, stdout, stderr) {
                console.timeEnd('bowtie');
                var bowtiehits = stdout.split('\n');
                var hits = {}; //object... see http://stackoverflow.com/questions/6657790/javascript-using-numeric-array-as-associate-array
                _.each(bowtiehits, function(value, key) {
                    if (value !== '') {
                        var row = value.split(' ');
                        hits[parseInt(row[0])] = {
                            count: parseInt(row[1])
                        };
                    }
                });
                targets = _.filter(targets, function(value, index) {
                    for (var i = index * 8; i < (index + 1) * 8; i++) {
                        if (hits[i] && hits[i].count > 1) {
                            return false;
                        } else if (!hits.hasOwnProperty(i)){ //if there's no hit in the genome don't include the target
                            return false;
                        }
                    }
                    return true;
                });
                _.each(targets, function(target) {
                    target.position = (orf_sequence.indexOf(target.sequence) >= 0 ? orf_sequence.indexOf(target.sequence) + 23 : orf_sequence.indexOf(utilities.reverse_complement(target.sequence)));
                    target.GC_content = (target.sequence_wo_pam.split(/[GC]/).length - 1) / (target.sequence_wo_pam.length);
                });
                
                var rna_end = 'GTTTTAGAGCTAGAAATAGCAAGTTAAAATAAGGCTAGTCCGTTATCAACTTGAAAAAGTGGCACCGAGTCGGTGGTGCTTTTTT';
                console.time("rna_fold");
                var rnas = _.map(targets,function(value,key){return value.sequence_wo_pam + rna_end;});
                //problem with YMR306W
                vienna_rna.get_centroid_struct(rnas,function(err, rows){
                    console.timeEnd("rna_fold");
                    _.each(rows, function(structure, key) {
                        targets[key].rna_fold = {
                            notation: structure,
                            score: structure.substring(0, 20).split('.').length - 1
                        };
                    });
                 //   locus.targets = targets;
                    
                    return cb(targets);
                    
                    cleanupCallback();
                    locus.save(function(err) {
                        return cb(locus.targets);
                    });
                });
            });
        });
    });
});

LocusSchema
    .virtual('repair_oligo_fw')
    .get(function() {
        return this.sequence.substring(this.start_orf - 60, this.start_orf) + this.sequence.substring(this.end_orf, this.end_orf + 60);
    });

LocusSchema
    .virtual('repair_oligo_rv')
    .get(function() {
        return utilities.reverse_complement(this.repair_oligo_fw);
    });

/**
 * Methods
 */
LocusSchema
    .virtual('reverse_complement')
    .get(function() {
        return utilities.reverse_complement(this.sequence);
    });

/**
 * Validations
 */
LocusSchema.path('orf').validate(function(orf) {
    return orf.length;
}, 'ORF cannot be blank');


LocusSchema.path('sequence').set(function(v) {
    return v.toUpperCase().replace(/[^ATGCN]/g, '');
});

/**
 * Statics
 */
LocusSchema.statics.load = function(id, cb) {
    this.findOne({
        _id: id
    }).populate('strain').exec(cb);
};

mongoose.model('Locus', LocusSchema);
