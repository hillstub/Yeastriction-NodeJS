'use strict';

angular.module('mean.loci').controller('LociController', ['$scope', '$rootScope', '$stateParams', '$location','$log','$filter', 'Global', 'Loci', 'Strains',
    function($scope, $rootScope, $stateParams, $location, $log, $filter, Global, Loci, Strains) {
        $scope.global = Global;
        $scope.$log = $log;

        $scope.create = function() {
            var locus = new Loci({
                orf: this.orf,
                sequence: this.sequence
            });
            locus.$save(function(response) {
                $location.path('crispr/loci/' + response._id);
            });

            this.orf = '';
            this.sequence = '';
        };

        $scope.remove = function(locus) {
            if (locus) {
                locus.$remove();

                for (var i in $scope.loci) {
                    if ($scope.loci[i] === locus) {
                        $scope.loci.splice(i, 1);
                    }
                }
            } else {
                $scope.locus.$remove();
                $location.path('crispr/loci');
            }
        };

        $scope.update = function() {
            var locus = $scope.locus;
            if (!locus.updated) {
                locus.updated = [];
            }
            locus.updated.push(new Date().getTime());
            //because strain is a ref only its _id should be uploaded
            locus.strain = locus.strain_id;
            locus.$update(function() {
                $location.path('crispr/loci/' + locus._id);
            });
        };

        $scope.find = function() {
            Loci.query(function(loci) {
                $scope.loci = loci;
            });
        };

        $scope.findOne = function() {
            Loci.get({
                locusId: $stateParams.locusId
            }, function(locus) {
                $scope.locus = locus;
                $scope.locus.strain_id = locus.strain._id;
            });
        };
    }
]);
