import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:plug',
      order: 1,
      title: $t('page.api.title'),
    },
    name: 'ApiEndpoint',
    path: '/api',
    children: [
      {
        name: 'ApiEndpointHome',
        path: '/api/index',
        component: () => import('#/views/api/index.vue'),
        meta: {
          icon: 'lucide:home',
          title: $t('page.api.home'),
        },
      },
      {
        name: 'ApiEndpointTasks',
        path: '/api/tasks',
        component: () => import('#/views/api/tasks/index.vue'),
        meta: {
          icon: 'lucide:list-todo',
          title: $t('page.api.tasks'),
        },
      },
      {
        name: 'ApiEndpointTaskDetail',
        path: 'task/detail/:taskId',
        component: () => import('#/views/api/tasks/index.vue'),
        meta: {
          hideInMenu: true,
          title: 'API 任务详情',
        },
      },
    ],
  },
];

export default routes;