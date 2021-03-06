/**
 * @file
 * Contains channel share directives.
 */

/**
 * channel-share directive.
 *
 * Enables sharing a channel.
 *
 * html-parameters
 *   ikChannel (object): Channel to share.
 */
angular.module('ikApp').directive('ikChannelShare', [
  function () {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        ikChannel: '='
      },
      link: function (scope) {
        scope.clickShare = function () {
          scope.$emit('ikChannelShare.clickShare', scope.ikChannel);
        };
      },
      templateUrl: 'apps/ikApp/shared/elements/channelShare/channel-share.html?' + window.config.version
    };
  }
]);
