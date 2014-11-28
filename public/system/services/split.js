angular.module('mean.system')
    .filter('split', function() {
        return function(input, n, delimiter) {
            // do some bounds checking here to ensure it has that index
            return input.match(new RegExp(".{1,"+n+"}", "g")).join(delimiter);
        }
    });