'use strict';

angular.module('mean.controllers.login', [])
    .controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location',
        function($scope, $rootScope, $http, $location) {
            // This object will be filled by the form
            $scope.user = {};

            // Register the login() function
            $scope.login = function() {
                $http.post('/login', {
                    email: $scope.user.email,
                    password: $scope.user.password
                })
                    .success(function(user) {
                        // authentication OK
                        $scope.loginError = 0;
                        $rootScope.user = user;
                        $rootScope.$emit('loggedin');
                        $location.url('/');
                    })
                    .error(function() {
                        $scope.loginerror = 'Authentication failed.';
                    });
            };
        }
    ])
    .controller('RegisterCtrl', ['$scope', '$rootScope', '$http', '$location',
        function($scope, $rootScope, $http, $location) {
            $scope.user = {};

            $scope.register = function() {
                $scope.usernameError = null;
                $scope.registerError = null;
                $http.post('/register', {
                    email: $scope.user.email,
                    password: $scope.user.password,
                    confirmPassword: $scope.user.confirmPassword,
                    username: $scope.user.username,
                    name: $scope.user.name
                })
                    .success(function() {
                        // authentication OK
                        $scope.registerError = 0;
                        $rootScope.user = $scope.user;
                        $rootScope.$emit('loggedin');
                        $location.url('/');
                    })
                    .error(function(error) {
                        // Error: authentication failed
                        if (error === 'Username already taken') {
                            $scope.usernameError = error;
                        } else {
                            $scope.registerError = error;
                        }
                    });
            };
        }
    ])

    .controller('UserSettingsController', ['$scope', '$rootScope', 'Global', '$http', '$location', 'Strains',
        function($scope, $rootScope, Global, $http, $location, Strains) {
            $scope.global = Global;
            $scope.find_strains = function() {
                Strains.query(function(strains) {
                    $scope.strains = strains;
                });
            };
            $rootScope.$on('loggedin', function() {
                $scope.global.user  =  $rootScope.user;
            });            
            $scope.user = $scope.global.user; 
            $scope.restriction_enzymes = [];
            if($scope.user && $scope.user.restriction_enzymes && $scope.user.restriction_enzymes instanceof Array){
                $scope.restriction_enzymes = $scope.user.restriction_enzymes.join('\n');
            }
            $scope.default_strain_id = ($scope.user.default_strain ? $scope.user.default_strain._id : null);
            
            $scope.update = function() {
                console.log($scope.user);
                if (!$scope.user.updated) {
                    $scope.user.updated = [];
                }
                $scope.user.updated.push(new Date().getTime());
                //because strain is a ref only its _id should be uploaded
                $scope.user.default_strain =  $scope.default_strain_id;
                console.log($scope.user);
                $scope.user.restriction_enzymes = $scope.restriction_enzymes.split(/[^A-z\d-]+/);
                $http.post('/users/update', $scope.user).success(function(user){
                    console.log(user);
                    $rootScope.user = user;
                    $rootScope.$emit('loggedin');
                    $location.url('/');
                }).error(function(error){
                    console.log(error);
                });
            };
        }
    ]);








