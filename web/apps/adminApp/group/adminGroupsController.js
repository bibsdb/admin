/**
 * @file
 * Controller for the admin groups page.
 */

angular.module('adminApp').controller('AdminGroupsController', [
  'busService', '$scope', '$timeout', 'ModalService', '$controller', '$filter', '$location',
  function (busService, $scope, $timeout, ModalService, $controller, $filter, $location) {
    'use strict';

    // Extend BaseController.
    $controller('BaseApiController', {$scope: $scope});

    // Get translation filter.
    var $translate = $filter('translate');

    // Check role.
    if (!$scope.requireRole('ROLE_GROUP_ADMIN')) {
      busService.$emit('log.error', {
        timeout: 5000,
        cause: 403,
        msg: $translate('common.error.forbidden')
      });

      $location.path('/');
      return;
    }

    $scope.groupsLoading = true;
    $scope.groups = null;
    $scope.max = null;

    /**
     * Add a group to the groups array.
     *
     * @param group
     *   The group to add.
     */
    function addGroup(group) {
      var actions = [];

      if ($scope.baseCanRead(group)) {
        actions.push({
          url: '#/admin/group/' + group.id,
          title: $translate('group.action.view')
        });
      }
      if ($scope.baseCanUpdate(group)) {
        actions.push({
          url: '#/admin/group/' + group.id,
          title: $translate('group.action.edit')
        });
      }
      if ($scope.baseCanDelete(group)) {
        actions.push({
          click: $scope.deleteGroup,
          entity: group,
          title: $translate('group.action.delete')
        });
      }

      // Add group.
      $scope.groups.push({
        id: group.id,
        url: '#/admin/group/' + group.id,
        title: group.displayName,
        actions: actions
      });
    }

    /**
     * Remove a group to the groups array.
     *
     * @param group
     *   The group to remove.
     */
    function removeGroup(group) {
      $timeout(function () {
        $scope.baseRemoveElementFromList($scope.groups, group, 'id');
      });
    }

    // Get the groups.
    $scope.getEntities('group').then(
      function success(result) {
        $scope.groups = [];

        for (var group in result) {
          if (result.hasOwnProperty(group)) {
            addGroup(result[group]);
          }
        }
      },
      function error(err) {
        busService.$emit('log.error', {
          timeout: 5000,
          cause: err.code,
          msg: $translate('group.messages.groups_not_found')
        });
      }
    ).then(function () {
      $scope.groupsLoading = false;
    });

    /**
     * Show create group modal.
     */
    $scope.createGroup = function () {
      // Show modal.
      ModalService.showModal({
        templateUrl: "apps/adminApp/group/popup-create-group.html",
        controller: "PopupCreateGroup"
      }).then(function (modal) {
        modal.close.then(function (group) {
          if (group) {
            addGroup(group);
          }
        });
      });
    };

    /**
     * Show delete group modal.
     */
    $scope.deleteGroup = function (group) {
      // Show modal.
      ModalService.showModal({
        templateUrl: "apps/adminApp/group/popup-delete-group.html",
        controller: "PopupDeleteGroup",
        inputs: {
          group: group
        }
      }).then(function (modal) {
        modal.close.then(function (group) {
          if (group) {
            removeGroup(group);
          }
        });
      });
    };
  }
]);
