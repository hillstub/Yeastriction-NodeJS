'use strict';

angular.module('mean.system').controller('ContactController', ['$scope', 'Global', 'noCAPTCHA', '$http',
    function($scope, Global, noCAPTCHA, $http) {
        $scope.global = Global;

        $scope.contact = function() {
            $scope.contacterror = '';
            $http.post('/contact', {
                    email: $scope.email,
                    message: $scope.message,
                    response: $scope.gRecaptchaResponse
                })
                .success(function(message) {
                    $scope.contactmessage = message;
                })
                .error(function(message) {
                    $scope.contacterror = message;
                });
        };
    }
]);
