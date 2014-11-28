'use strict';

angular.module('mean.crispr').controller('CrisprController', ['$scope', '$rootScope', '$location', 'Global', 'Strains', 'Loci', //'Crispr','Strains',
    function($scope, $rootScope, $location, Global, Strains, Loci, Crispr) {
        $scope.global = Global;
        $scope.crispr = {
            name: 'crispr'
        };



        $scope.find_strains = function() {
            var user = ($scope.global.user ? $scope.global.user : ($rootScope.user ? $rootScope.user : null));
            Strains.query(function(strains) {
                $scope.strains = strains;
                $scope.strain = user.default_strain._id;
            });
        };


        $scope.list_targets = function() {
            var loci = $scope.loci_list.split(/[^A-z\d-]+/).map(function(x) {
                return x.toUpperCase();
            });
            $scope.loading = true;
            Loci.findSome({
                loci: loci,
                strain: $scope.strain
            }, function(loci) {
                $rootScope.loci = loci;
                $location.path('/crispr/someloci');
            });
        };


    }
]);
