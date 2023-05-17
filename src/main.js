// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import store from '../store'


Vue.config.productionTip = false

Vue.prototype.$routeList = router.options.routes;
Vue.prototype.$abc = 123456
/* eslint-disable no-new */

NProgress.configure({     
  easing: 'ease',  // 动画方式    
  speed: 500,  // 递增进度条的速度    
  showSpinner: true, // 是否显示加载ico    
  trickleSpeed: 200, // 自动递增间隔    
  minimum: 0.3 // 初始化时的最小百分比
})


new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
