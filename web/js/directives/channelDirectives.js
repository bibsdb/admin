ikApp.directive('ikChannel', ['$interval', 'channelFactory', 'slideFactory', 'templateFactory', function($interval, channelFactory, slideFactory, templateFactory) {
  return {
    restrict: 'E',
    scope: {
      ikWidth: '@',
      ikId: '@'
    },
    link: function(scope, element, attrs) {
      scope.slideIndex = 0;
      scope.channel = {};
      scope.slides = [];
      scope.templateURL = '/partials/slide/slide-loading.html';
      scope.playText = '';

      scope.setTemplate = function() {
        scope.ikSlide = scope.slides[scope.slideIndex];
        scope.templateURL = '/ik-templates/' + scope.ikSlide.template + '/' + scope.ikSlide.template + '.html';

        var template = templateFactory.getTemplate(scope.ikSlide.template);

        if (scope.ikSlide.options.images.length > 0) {
          if (scope.ikSlide.imageUrls[scope.ikSlide.options.images[0]] === undefined) {
            scope.ikSlide.currentImage = '/images/not-found.png';
          }
          else {
            scope.ikSlide.currentImage = scope.ikSlide.imageUrls[scope.ikSlide.options.images[0]]['default_landscape_small'];
          }
        } else {
          scope.ikSlide.currentImage = '';
        }

        scope.theStyle = {
          width: "" + scope.ikWidth + "px",
          height: "" + parseFloat(template.idealdimensions.height * parseFloat(scope.ikWidth / template.idealdimensions.width)) + "px",
          fontsize: "" + parseFloat(scope.ikSlide.options.fontsize * parseFloat(scope.ikWidth / template.idealdimensions.width)) + "px"
        }
      }

      attrs.$observe('ikId', function(val) {
        if (!val) {
          return;
        }

        channelFactory.getChannel(val).then(function(data) {
          scope.channel = data;
          angular.forEach(scope.channel.slides, function(value, key) {
            slideFactory.getSlide(value).then(function(data) {
              scope.slides[key] = (data);
              if (key === 0) {
                scope.setTemplate();
                scope.buttonState = 'play';
              }
            });
          });
        });
      });

      scope.play = function() {
        if (angular.isDefined(scope.interval)) {
          $interval.cancel(scope.interval);
          scope.interval = undefined;
          scope.buttonState = 'play';
        } else {
          scope.slideIndex = (scope.slideIndex + 1) % scope.slides.length;
          scope.setTemplate();

          scope.interval = $interval(function() {
            scope.setTemplate();

            scope.slideIndex = (scope.slideIndex + 1) % scope.slides.length;
          }, 2000);
          scope.buttonState = 'pause';
        }
      }

      scope.$on('$destroy', function() {
        if (angular.isDefined(scope.interval)) {
          $interval.cancel(scope.interval);
          scope.interval = undefined;
        }
      });
    },
    template: '<div class="preview--channel"><div data-ng-include="" src="templateURL" class="preview--channel-display"></div><div class="preview--channel-{{buttonState}}" ng-click="play()"></div></div>'
  }
}]);