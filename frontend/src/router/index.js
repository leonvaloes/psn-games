import { createRouter, createWebHistory } from 'vue-router';
import HomeView        from '../views/HomeView.vue';
import GameDetailView  from '../views/GameDetailView.vue';
import LoginView       from '../views/LoginView.vue';
import RegisterView    from '../views/RegisterView.vue';
import FavoritesView   from '../views/FavoritesView.vue';
import GuidesView      from '../views/GuidesView.vue';
import GuideDetailView from '../views/GuideDetailView.vue';
import GuideEditorView from '../views/GuideEditorView.vue';

function requireAuth() {
  if (!localStorage.getItem('token')) return '/login';
}

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',                                        component: HomeView },
    { path: '/game/:slug',                              component: GameDetailView },
    { path: '/game/:slug/guides',                       component: GuidesView },
    { path: '/game/:slug/guides/new',                   component: GuideEditorView, beforeEnter: requireAuth },
    { path: '/game/:slug/guides/:id',                   component: GuideDetailView },
    { path: '/game/:slug/guides/:id/edit',              component: GuideEditorView, beforeEnter: requireAuth },
    { path: '/login',                                   component: LoginView },
    { path: '/register',                                component: RegisterView },
    { path: '/favorites',                               component: FavoritesView, beforeEnter: requireAuth }
  ],
  scrollBehavior: () => ({ top: 0 })
});
