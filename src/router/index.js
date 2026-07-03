import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import MapView from '@/views/MapView.vue'
import CityView from '@/views/CityView.vue'
import SpotView from '@/views/SpotView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',                    component: HomeView },
    { path: '/map',                 component: MapView },
    { path: '/map/:city',           component: CityView },
    { path: '/map/:city/:spotId',   component: SpotView },
    { path: '/404',                 component: NotFoundView },
    { path: '/:pathMatch(.*)*',     redirect: '/404' },
  ],
})

export default router
