'use strict';

angular.module('mean.crispr').config(['$stateProvider',
    function($stateProvider) {
        $stateProvider.state('start crispr', {
            url: '/crispr/start',
            templateUrl: 'public/crispr/views/index.html'
        })
    }
]);
