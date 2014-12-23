'use strict';

console.log('loaded loci.js route');
//Setting up route
angular.module('mean.loci').config(['$stateProvider',
    function($stateProvider) {

        //================================================
        // Check if the user is connected
        //================================================
        var checkLoggedin = function($q, $timeout, $http, $location) {
            // Initialize a new promise
            var deferred = $q.defer();

            // Make an AJAX call to check if the user is logged in
            $http.get('/loggedin').success(function(user) {
                // Authenticated
                if (user !== '0')
                    $timeout(deferred.resolve, 0);

                // Not Authenticated
                else {
                    $timeout(function() {
                        deferred.reject();
                    }, 0);
                    $location.url('/login');
                }
            });

            return deferred.promise;
        };

        // states for my app
        $stateProvider
            .state('crispr all loci', {
                url: '/crispr/loci',
                templateUrl: 'public/crispr/loci/views/list.html',
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .state('crispr some loci', {
                url: '/crispr/someloci',
                templateUrl: 'public/crispr/loci/views/list_some.html',
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .state('crispr create locus', {
                url: '/crispr/loci/create',
                templateUrl: 'public/crispr/loci/views/create.html',
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .state('crispr edit locus', {
                url: '/crispr/loci/:locusId/edit',
                templateUrl: 'public/crispr/loci/views/edit.html',
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .state('crispr locus by id', {
                url: '/crispr/loci/:locusId',
                templateUrl: 'public/crispr/loci/views/view.html',
                resolve: {
                    loggedin: checkLoggedin
                }
            });
    }
]);
