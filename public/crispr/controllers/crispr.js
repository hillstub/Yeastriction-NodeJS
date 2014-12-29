'use strict';

angular.module('mean.crispr').controller('CrisprController', ['$scope', '$rootScope', '$stateParams', '$location', '$filter', 'Global', 'Strains', 'Loci', 'RestrictionEnzymes', //'Crispr','Strains',
    function($scope, $rootScope, $location, $stateParams, $filter, Global, Strains, Loci, RestrictionEnzymes) {
        $scope.global = Global;

        
        $scope.crispr = {
            name: 'crispr'
        };
        $scope.tabs = [,,]; //just to be able to change tabs after loading the first locus
        $scope.loci = [];
        $scope.loci_fetching = [];
        $scope.loci_fetched = [];
        $scope.loci_failed = [];

        $scope.method1_presequence = 'TGCGCATGTTTCGGCGTTCGAAACTTCTCCGCAGTGAAAGATAAATGATC';
        $scope.method1_postsequence = 'GTTTTAGAGCTAGAAATAGCAAGTTAAAATAAGGCTAGTCCGTTATCAAC';
        $scope.method2_presequence = 'TGCGCATGTTTCGGCGTTCGAAACTTCTCCGCAGTGAAAGATAAATGATC';
        $scope.method2_postsequence = 'GTTTTAGAGCTAGAAATAGCAAGTTAAAATAAG';

        if($scope.global.user){
            $scope.form = {
                crispr_method : $scope.global.user.crispr_method,
                show_diagnostic_primers : $scope.global.user.show_diagnostic_primers,
                ranking_restriction_sites : $scope.global.user.ranking_restriction_sites,
                ranking_gc_content : $scope.global.user.ranking_gc_content,
                ranking_secondary_structure : $scope.global.user.ranking_secondary_structure
            };
        }else{
            $scope.form = {
                crispr_method : 1,
                show_diagnostic_primers : true,
                ranking_restriction_sites : false,
                ranking_gc_content : true,
                ranking_secondary_structure : true
            };
        }
        $scope.form.loci_list = '';
        $rootScope.$on('loggedin', function() {
            $scope.global.user  =  $rootScope.user;
        });
        
        $scope.find_strains = function() {
           // var user = ($scope.global.user ? $scope.global.user : ($rootScope.user ? $rootScope.user : null));
            console.log('find_strains User',$scope.global.user);
            Strains.query(function(strains) {
                $scope.strains = strains;
                if($scope.global.user){
                    $scope.form.strain = $scope.global.user.default_strain._id;
                }
            });
        };


        $scope.list_targets = function() {
            $scope.loci_fetching = $scope.form.loci_list.match(/([\d\-A-z])+(,\d+)?/g).map(function(x) {
                return x.toUpperCase();
            });
            //only unqiue values
            $scope.loci_fetching = $scope.loci_fetching.filter(function(v,i) { return $scope.loci_fetching.indexOf(v) === i; });
            $scope.loading = true;
            $scope.loci = [];
            $scope.loci_fetched = [];
            $scope.loci_failed = [];
            if($scope.loci_fetching.length > 0){
                $scope.loci_fetching.forEach(function(locus){ 
                    console.log(locus);         
                    Loci.findOne({
                        locus: locus,
                        strain: $scope.form.strain
                    }, function(el) {
                        console.log(locus,el);
                        if(el.hasOwnProperty('_id')){
                            console.log(el,Object.getOwnPropertyNames(el).length);
                            el.display_name = locus;
                            $scope.loci.push(el);
                            $scope.findSome();
                            $scope.loci_fetched.push(locus);
                        }else{
                            $scope.loci_failed.push(locus);
                        }
                        if(($scope.loci_fetched.length + $scope.loci_failed.length) === 1){
                            $scope.tabs[2].active = true;
                            //go to result tab page
                        }
                        $scope.loci_fetching = $filter('filter')($scope.loci_fetching, '!'+locus);
                        if($scope.loci_fetching.length === 0){
                            $scope.loading = false;
                        }
                    });
                });
            }
        };


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

   /*     $scope.find = function() {
            Loci.query(function(loci) {
                $scope.loci = loci;
            });
        };*/

        $scope.$watchGroup(['form.ranking_restriction_sites', 'form.ranking_gc_content','form.ranking_secondary_structure'], function() {
            $scope.updateRanking();
        });

        $scope.updateRanking = function(){
            $scope.loci.forEach(function(el) {
                
                var ranges = {
                    rna_fold_score : { 
                        min : Math.min.apply(Math, el.targets.map(function(target) {  return target.rna_fold.score;})),
                        max : Math.max.apply(Math, el.targets.map(function(target) {  return target.rna_fold.score;})) 
                    },
                    gc_content : {
                        min: Math.min.apply(Math, el.targets.map(function(target) { return target.GC_content;})),
                        max: Math.max.apply(Math, el.targets.map(function(target) { return target.GC_content;}))
                    }

                };
                el.targets.forEach(function(target) {
                    target.score = 0;
                    if($scope.form.ranking_restriction_sites === true){
                        target.score += Math.min(1,target.enzymes.length);
                    }
                    if($scope.form.ranking_gc_content === true){
                        target.score += 1-((target.GC_content-ranges.gc_content.min)/(ranges.gc_content.max - ranges.gc_content.min));
                    }
                    if($scope.form.ranking_secondary_structure === true){
                        target.score += (target.rna_fold.score-ranges.rna_fold_score.min)/(ranges.rna_fold_score.max - ranges.rna_fold_score.min);
                    }
                    

                });   
                var orderBy = $filter('orderBy');
                el.targets = orderBy(el.targets, '-score');          
                el.target = el.targets[0];
            }); 
        };

        $scope.reverse_complement = function(sequence) {
            var replaceChars = {
                'A': 'T',
                'T': 'A',
                'G': 'C',
                'C': 'G',
                'N': 'N',
                'a': 't',
                't': 'a',
                'g': 'c',
                'c': 'g',
                'n': 'n'
            };
            sequence = sequence.replace(/[ATGC]/ig, function(match) {
                return replaceChars[match];
            });
            return sequence.split('').reverse().join('');
        };

        $scope.findSome = function() {
            $scope.loci.forEach(function(locus){
                locus.targets.forEach(function(target){
                  target.enzymes = [];
                    if(!!$scope.global.user && $scope.global.user.hasOwnProperty('restriction_enzymes') && $scope.global.user.restriction_enzymes instanceof Array){
                        $scope.global.user.restriction_enzymes.forEach(function(enzyme) {
                            if (RestrictionEnzymes.hasRestrictionSite(target.sequence_wo_pam, enzyme)) {
                                target.enzymes.push(enzyme);
                            }
                        });
                    }
                });
            });
            $scope.updateRanking();
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
