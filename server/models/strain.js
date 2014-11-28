'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Locus = mongoose.model('Locus');


/**
 * Strain Schema
 */
var StrainSchema = new Schema({
    name: {
        type: String,
        default: '',
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    }
});

/**
 * Validations
 */
StrainSchema.path('name').validate(function(name) {
    return name.length;
}, 'Name cannot be blank');

/**
 * Statics
 */
StrainSchema.statics.load = function(id, cb) {
    this.findOne({
        _id: id
    }).exec(cb);
};

StrainSchema.pre('remove', function(next) {
    console.log("pre remove");
    Locus.remove({
        strain: this._id
    }).exec();
    next();
});

mongoose.model('Strain', StrainSchema);
