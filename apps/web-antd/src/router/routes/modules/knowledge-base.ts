import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:book-a',
      order: 3,
      title: '知识库',
    },
    name: 'KnowledgeBase',
    path: '/knowledge',
    children: [
      {
        name: 'SensitiveKnowledge',
        path: '/knowledge/sensitive-knowledge',
        component: () => import('#/views/sensitive/knowledge/index.vue'),
        meta: {
          icon: 'lucide:book-open',
          title: $t('page.sensitive.knowledge'),
        },
      },
      {
        name: 'AgentResource',
        path: '/knowledge/agent-resource',
        component: () => import('#/views/dashboard/workspace/agent-resource.vue'),
        meta: {
          icon: 'lucide:package',
          title: $t('page.dashboard.agentResource'),
        },
      },
    ],
  },
];

export default routes;
