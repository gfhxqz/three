import Vue from 'vue'
import Router from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
Vue.use(Router)
//NProgress.configure({ showSpinner: false })
const routeList = [
  {
    path: '/',
    name: 'index',
    meta: { title: '首页' },
    component: () => import('@/views/index')
  }
]

const router = new Router({
  mode:'hash',
  base: process.env.BASE_URL,
  routes: routeList
})

router.beforeEach((to, from , next) => {
  // 每次切换页面时，调用进度条
  NProgress.start();
  // 这个一定要加，没有next()页面不会跳转的。这部分还不清楚的去翻一下官网就明白了
  next();
});

router.afterEach(() => {  
  // 在即将进入新的页面组件前，关闭掉进度条
  // NProgress.done()
})



export default router

