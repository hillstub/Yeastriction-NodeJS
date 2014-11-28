'use strict';

//Loci service used for articles REST endpoint
angular.module('mean.loci').factory('Loci', ['$resource',
    function($resource) {
        return $resource('crispr/loci/:locusId', {
            locusId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            findSome: {
                method: 'GET',
                url: 'crispr/loci/',
                /*	        params  : { id: identity.id },*/
                isArray: true
            }
        });
    }
]);
