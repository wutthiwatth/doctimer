import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GroupEditorView from '../views/GroupEditorView.vue'
import PreSessionView from '../views/PreSessionView.vue'
import ActiveSessionView from '../views/ActiveSessionView.vue'
import SummaryView from '../views/SummaryView.vue'
import HistoryView from '../views/HistoryView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/groups/new', component: GroupEditorView },
    { path: '/groups/:id/edit', component: GroupEditorView },
    { path: '/prepare/:id', component: PreSessionView },
    { path: '/session', component: ActiveSessionView },
    { path: '/summary/:id?', component: SummaryView },
    { path: '/history', component: HistoryView },
  ],
})
