'use strict';

/**
 * Temp function for reverse complement
 */

exports.reverse_complement = function(sequence) {
    var replaceChars = {
        'A': 'T',
        'T': 'A',
        'G': 'C',
        'C': 'G',
        'N': 'N'
    };
    sequence = sequence.replace(/[ATGCN]/g, function(match) {
        return replaceChars[match];
    });
    return sequence.split('').reverse().join('');
};

exports.boulderIOtoJSON = function(boulder) {
    var json = {};
    var rows = boulder.split('\n');
    rows.forEach(function(row) {
        row = row.split('=');
        if (row[0] && row[1]) {
            json[row[0]] = row[1];
        }
    });
    return json;
};
