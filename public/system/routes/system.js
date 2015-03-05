'use strict';

//Setting up route
angular.module('mean.system').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        // For unmatched routes:
        $urlRouterProvider.otherwise('/');

        // states for my app
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'public/crispr/views/index.html'
  //              templateUrl: 'public/crispr/views/index.html'
            })
            .state('todo', {
                url: '/todo',
                templateUrl: 'public/system/views/index.html'
            })
            .state('cite', {
                url: '/cite',
                templateUrl: 'public/system/views/cite.html'
            })            
            .state('auth', {
                templateUrl: 'public/auth/views/index.html'
            });
    }
])
    .config(['$locationProvider',
        function($locationProvider) {
            $locationProvider.hashPrefix('!');
        }
    ]);
