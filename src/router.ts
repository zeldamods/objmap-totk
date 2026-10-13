import { createRouter, createWebHashHistory } from 'vue-router';

import AppMap from '@/components/AppMap.vue';

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/map', redirect: '/map/zx,0,0' },
    {
      path: '/map/z:zoom,:x,:z',
      name: 'map',
      component: AppMap,
    },
    {
      path: '/map/z:zoom,:x,:z,:layer',
      name: 'map_with_layer',
      component: AppMap,
    },
    { path: '/:pathMatch(.*)*', redirect: '/map' },
  ],
});
