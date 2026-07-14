import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
        },
      },
      {
        name: 'Workspace',
        path: '/workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace'),
        },
      },
      {
        name: 'TaskDetail',
        path: 'task/detail/:taskId',
        component: () => import('#/views/dashboard/workspace/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '任务详情',
        },
      },
      {
        name: 'TaskRunStatus',
        path: 'task/run-status/:taskId',
        component: () => import('#/views/dashboard/workspace/run-status.vue'),
        meta: {
          hideInMenu: true,
          title: '运行状态',
        },
      },
      {
        name: 'BizData',
        path: 'task/biz-data/:taskId',
        component: () => import('#/views/dashboard/workspace/biz-data.vue'),
        meta: {
          hideInMenu: true,
          title: '业务范围',
        },
      },
      {
        name: 'TaskVulnDetail',
        path: 'task/vuln-detail/:taskId',
        component: () => import('#/views/dashboard/workspace/vuln-detail.vue'),
        meta: {
          hideInMenu: true,
          title: '漏洞明细',
        },
      },
      {
        name: 'TaskRescan',
        path: 'task/rescan/:taskId',
        component: () => import('#/views/dashboard/workspace/rescan.vue'),
        meta: {
          hideInMenu: true,
          title: '复扫任务',
        },
      },
    ],
  },
];

export default routes;
