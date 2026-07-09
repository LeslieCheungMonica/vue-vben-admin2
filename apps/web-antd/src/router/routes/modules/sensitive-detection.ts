import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 2,
      title: $t('page.sensitive.title'),
    },
    name: 'SensitiveDetection',
    path: '/sensitive',
    children: [
      {
        name: 'SensitiveHome',
        path: '/sensitive/home',
        component: () => import('#/views/sensitive/home/index.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: $t('page.sensitive.home'),
        },
      },
      {
        name: 'SensitiveData',
        path: '/sensitive/data',
        component: () => import('#/views/sensitive/data/index.vue'),
        meta: {
          icon: 'lucide:database',
          title: $t('page.sensitive.data'),
        },
      },
      {
        name: 'SensitiveDetectionResult',
        path: '/sensitive/detection',
        component: () => import('#/views/sensitive/detection/index.vue'),
        meta: {
          icon: 'lucide:search',
          title: $t('page.sensitive.detection'),
        },
      },
      {
        name: 'SensitiveReport',
        path: '/sensitive/report',
        component: () => import('#/views/sensitive/report/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('page.sensitive.report'),
        },
      },
      {
        name: 'SensitiveModel',
        path: '/sensitive/model',
        component: () => import('#/views/sensitive/model/index.vue'),
        meta: {
          icon: 'lucide:settings',
          title: $t('page.sensitive.model'),
        },
      },
      {
        name: 'SensitiveAgent',
        path: '/sensitive/agent',
        component: () => import('#/views/sensitive/agent/index.vue'),
        meta: {
          icon: 'lucide:bot',
          title: $t('page.sensitive.agent'),
        },
      },
    ],
  },
];

export default routes;
