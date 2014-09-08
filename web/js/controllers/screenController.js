/**
 * Screen controller. Controls the screen creation process.
 */
ikApp.controller('ScreenController', function($scope, $location, $routeParams, $timeout, screenFactory) {
  /**
   * Scope setup
   */
  $scope.steps = 3;
  $scope.screen = {};
  $scope.groups = [];
  screenFactory.getScreenGroups().then(function(data) {
    $scope.groups = data;
  });


  /**
   * Loads a given step
   */
  function loadStep(step) {
    $scope.step = step;
    $scope.templatePath = '/partials/screen/screen' + $scope.step + '.html';
  }

  /**
   * Constructor.
   * Handles different settings of route parameters.
   */
  function init() {
    if (!$routeParams.id) {
      // If the ID is not set, get an empty slide.
      $scope.screen = screenFactory.emptyScreen();
      loadStep(1);
    } else {
      if ($routeParams.id == null || $routeParams.id == undefined || $routeParams.id == '') {
        $location.path('/screen');
      } else {
        // Get the screen from the backend.
        screenFactory.getEditScreen($routeParams.id).then(function(data) {
          $scope.screen = data;
          $scope.screen.status = 'edit-screen';

          if ($scope.screen === {}) {
            $location.path('/screen');
          }

          loadStep($scope.steps);
        });
      }
    }
  }
  init();

  /**
   * Submit a step in the installation process.
   */
  $scope.submitStep = function() {
    if ($scope.step == $scope.steps) {
      screenFactory.saveScreen().then(function() {
        $timeout(function() {
          $location.path('/screen-overview');
        }, 500);
      });
    } else {
      loadStep($scope.step + 1);
    }
  }

  /**
   * Set the orientation of the screen.
   * @param orientation
   */
  $scope.setOrientation = function(orientation) {
    $scope.screen.orientation = orientation;
  }

  $scope.goToStep = function(step) {
    var s = 1;
    if ($scope.validation.titleSet()) {
      s++;
      if ($scope.validation.widthSet() && $scope.validation.heightSet()) {
        s = s + 2;
      }
    }
    if (step <= s) {
      loadStep(step);
    }
  };

  /**
   * Validates that @field is not empty on screen.
   */
  function validateNotEmpty(field) {
    if (!$scope.screen) {
      return false;
    }
    return $scope.screen[field] !== '';
  }

  /**
   * Handles the validation of the data in the screen.
   */
  $scope.validation = {
    titleSet: function() {
      return validateNotEmpty('title');
    },
    widthSet: function() {
      return (/^\d+$/.test($scope.screen.width));
    },
    heightSet: function() {
      return (/^\d+$/.test($scope.screen.height));
    }
  };
});