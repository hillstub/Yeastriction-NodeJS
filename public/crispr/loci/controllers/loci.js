'use strict';

angular.module('mean.loci').controller('LociController', ['$scope', '$rootScope', '$stateParams', '$location','$log','$filter', 'Global', 'Loci', 'Strains',
    function($scope, $rootScope, $stateParams, $location, $log, $filter, Global, Loci, Strains) {
        $scope.global = Global;
        $scope.$log = $log;

        $scope.method1_presequence = "TGCGCATGTTTCGGCGTTCGAAACTTCTCCGCAGTGAAAGATAAATGATC";
        $scope.method1_postsequence = "GTTTTAGAGCTAGAAATAGCAAGTTAAAATAAGGCTAGTCCGTTATCAAC";
        $scope.method2_presequence = "TGCGCATGTTTCGGCGTTCGAAACTTCTCCGCAGTGAAAGATAAATGATC";
        $scope.method2_postsequence = "GTTTTAGAGCTAGAAATAGCAAGTTAAAATAAG";
        $scope.restriction_enzymes = {
            'ApaI': /GGGCCC/,
            'BamHI': /GGATCC/,
            'BglII': /AGATCT/,
            'ClaI': /ATCGAT/,
            'DraI': /TTTAAA/,
            'EagI': /CGGCCG/,
            'Eco31I': /GGTCTC/,
            'Eco91I': /GGT.ACC/,
            'EcoRI': /GAATTC/,
            'EcoRV': /GATATC/,
            'HaeIII': /GGCC/,
            'HindIII': /AAGCTT/,
            'HpaI': /CCGG/,
            'KpnI': /GGTACC/,
            'MluI': /ACGCGT/,
            'NaeI': /GCCGGC/,
            'NcoI': /CCATGG/,
            'NdeI': /CATATG/,
            'NheI': /GCTAGC/,
            'NotI': /GCGGCCGC/,
            'NsiI': /ATGCAT/,
            'PdmI': /GAA.{4}TTC/,
            'PfoI': /TCC.GGA/,
            'PsiI': /TTATAA/,
            'PvuI': /CGATCG/,
            'PvuII': /CAGCTG/,
            'SacI': /GAGCTC/,
            'SalI': /GTCGAC/,
            'SbfI': /CCTGCAGG/,
            'SexAI': /ACC[AT]GGT/,
            'SmaI': /CCCGGG/,
            'SnaBI': /TACGTA/,
            'SpeI': /ACTAGT/,
            'SspI': /AATATT/,
            'StuI': /AGGCCT/,
            'XbaI': /TCTAGA/,
            'XhoI': /CTCGAG/
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

        $scope.find = function() {
            Loci.query(function(loci) {
                $scope.loci = loci;
            });
        };

        $scope.$watchGroup(['ranking_restriction_sites', 'ranking_gc_content','ranking_secondary_structure'], function(newValues, oldValues, scope) {
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

                }
                el.targets.forEach(function(target) {
                    target.score = 0;
                    if($scope.ranking_restriction_sites == true){
                        target.score += Math.min(1,target.enzymes.length);
                    }
                    if($scope.ranking_gc_content == true){
                        target.score += 1-((target.GC_content-ranges.gc_content.min)/(ranges.gc_content.max - ranges.gc_content.min));
                    }
                    if($scope.ranking_secondary_structure == true){
                        target.score += (target.rna_fold.score-ranges.rna_fold_score.min)/(ranges.rna_fold_score.max - ranges.rna_fold_score.min);
                    }
                    

                });   
                var orderBy = $filter('orderBy');
                el.targets = orderBy(el.targets, '-score');          
                el.target = el.targets[0];
            }); 
        }

        $scope.reverse_complement = function(sequence) {
            var replaceChars = {
                "A": "T",
                "T": "A",
                "G": "C",
                "C": "G",
                "N": "N",
                "a": "t",
                "t": "a",
                "g": "c",
                "c": "g",
                "n": "n"
            };
            sequence = sequence.replace(/[ATGC]/ig, function(match) {
                return replaceChars[match];
            });
            return sequence.split('').reverse().join('');
        }

        $scope.findSome = function() {
            var user = ($scope.global.user ? $scope.global.user : ($rootScope.user ? $rootScope.user : null));
            $scope.crispr_method = user.crispr_method;
            $scope.show_diagnostic_primers = user.show_diagnostic_primers;
            $scope.ranking_restriction_sites = user.ranking_restriction_sites;
            $scope.ranking_gc_content = user.ranking_gc_content;
            $scope.ranking_secondary_structure = user.ranking_secondary_structure;
            $scope.loci.forEach(function(locus){
                locus.targets.forEach(function(target){
                  target.enzymes = [];
                    if(user.hasOwnProperty('restriction_enzymes') && user.restriction_enzymes instanceof Array){
                        user.restriction_enzymes.forEach(function(enzyme) {
                            if ($scope.restriction_enzymes.hasOwnProperty(enzyme) && (target.sequence_wo_pam.match($scope.restriction_enzymes[enzyme]) || $scope.reverse_complement(target.sequence_wo_pam).match($scope.restriction_enzymes[enzyme]))) {
                                target.enzymes.push(enzyme);
                            }
                        });
                    }
                });
            });
            $scope.updateRanking();
        };

        $scope.find_strains = function() {
            Strains.query(function(strains) {
                $scope.strains = strains;
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
