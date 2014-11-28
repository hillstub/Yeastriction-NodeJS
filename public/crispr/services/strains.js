'use strict';

//Strains service used for articles REST endpoint
angular.module('mean.strains').factory('Strains', ['$resource',
    function($resource) {
        return $resource('crispr/strains/:strainId', {
            strainId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);
