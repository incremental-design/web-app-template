import {
  Router,
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  createMemoryHistory,
} from 'vue-router';
import Home from '../views/Home.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: Home,
  },
];

export default function (): Router {
  const router = createRouter({
    history:
      typeof window === 'undefined'
        ? createMemoryHistory(process.env.BASE_URL)
        : createWebHistory(process.env.BASE_URL),
    routes,
  });
  return router;
}
