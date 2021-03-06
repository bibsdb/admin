<?php

namespace Indholdskanalen\MainBundle\Services;

use Doctrine\ORM\EntityManagerInterface;
use Indholdskanalen\MainBundle\Entity\Group;
use Indholdskanalen\MainBundle\Entity\GroupableEntity;
use Indholdskanalen\MainBundle\Entity\User;
use Indholdskanalen\MainBundle\Entity\UserGroup;
use Indholdskanalen\MainBundle\Security\Roles;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * Class EntityManagerService
 *
 * Service to help finding entities that the current user can view/edit.
 *
 * @package Indholdskanalen\MainBundle\Services
 */
class EntityManagerService {
  protected $manager;
  protected $tokenStorage;
  protected $authorizationChecker ;

  public function __construct(EntityManagerInterface $manager, TokenStorageInterface $tokenStorage, AuthorizationCheckerInterface $authorizationChecker) {
    $this->manager = $manager;
    $this->tokenStorage = $tokenStorage;
    $this->authorizationChecker = $authorizationChecker;
  }

  public function findAll($class) {
    return $this->findBy($class, []);
  }

  public function findBy($class, array $criteria, array $orderBy = null, $limit = null, $offset = null) {
    $repository = $this->manager->getRepository($class);
    $this->addCriteria($class, $criteria);
    return $repository->findBy($criteria, $orderBy, $limit, $offset);
  }

  private function addCriteria($class, array &$criteria = NULL) {
    if ($this->authorizationChecker->isGranted(Roles::ROLE_ADMIN)) {
      return;
    }

    $user = $this->tokenStorage->getToken()->getUser();
    if (!$user) {
      $criteria['id'] = [];
    }

    switch ($class) {
      case Group::class:
        return $this->addCriteriaGroup($criteria, $user);
      case User::class:
        return $this->addCriteriaUser($criteria, $user);
    }

    if (is_subclass_of($class, GroupableEntity::class)) {
      return $this->addCriteriaGroupable($class, $criteria, $user);
    }
  }

  private function addCriteriaGroup(array &$criteria, User $user) {
    if ($this->authorizationChecker->isGranted(Roles::ROLE_GROUP_ADMIN)) {
      return;
    }

    // Find all groups in which current user is member.
    $builder = $this->manager->createQueryBuilder();
    $query = $builder
      ->select('g')
      ->from(UserGroup::class, 'g')
      ->where('g.user = :user')
      ->getQuery();
    $result = $query->setParameters([
      'user' => $user,
    ])->getResult();

    $ids = [];
    foreach ($result as $userGroup) {
      $ids[] = $userGroup->getGroup()->getId();
    }
    if (isset($criteria['id'])) {
      $ids = array_intersect($ids, $criteria['id']);
    }
    $criteria['id'] = $ids;
  }


  private function addCriteriaUser(array &$criteria, User $user) {
    // @TODO
  }

  private function addCriteriaGroupable($class, array &$criteria, User $user) {
    if ($this->authorizationChecker->isGranted(Roles::ROLE_ADMIN)) {
      return;
    }

    $tableName = $this->manager->getClassMetadata($class)->getTableName();

    // User can see all groupables created by himself
    $sql = 'select id from ' . $tableName . ' where user = :user_id';
    // Plus all groupables in groups he's a member of
    $sql .= ' union select entity_id id from ik_grouping where entity_type = :entity_type and group_id in (select group_id from ik_user_group where user_id = :user_id)';

    $result = $this->manager->getConnection()->fetchAll($sql, [
      'entity_type' => $class,
      'user_id' => $user->getId(),
    ]);
    $ids = array_map(function ($row) {
      return $row['id'];
    }, $result);

    if (isset($criteria['id'])) {
      $ids = array_intersect($ids, $criteria['id']);
    }
    $criteria['id'] = $ids;
  }

}
