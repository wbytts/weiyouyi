export { effect } from './effect'
export { computed } from './computed'
export { reactive ,shallowReactive} from './reactive'
export { ref, isRef } from './ref';

/*
响应式机制的主要功能就是，可以把普通的JS对象封装成为响应式对象，
拦截数据的获取和修改操作，实现依赖数据的自动化更新

一个简单的响应模型：通过 reactive 或者 ref 函数，把数据包裹成响应式对象，
并通过effect函数注册回调函数，然后在数据修改之后，响应式地通知effect去执行回调函数即可

Vue的响应式是可以独立在其他平台使用的

在读取数据的时候通过track收集函数的依赖关系，把整个对象和effect注册函数的依赖关系全部存储在一个依赖图中

定义的dependsMap是一个巨大的Map数据，effect函数内部读取的数据都会存储在dependsMap中
数据在修改的时候，通过查询 dependsMap，获得需要执行的函数，再去执行即可

dependsMap中存储的也不是直接存储effect中传递的函数，而是包装了一层对象对这个函数执行实际进行管理
内部可以通过active管理执行状态
还可以通过全局变量shouldTrack控制监听状态，
并且执行的方式也是判断 sheduler和run方法，实现了对性能的提升

我们在日常项目开发中也可以借鉴响应式的处理思路，使用通知的机制，来调用具体数据的操作和更新逻辑
灵活使用 effect、ref、reactive等函数把常见的操作全部变成响应式数据处理，
会极大地提高我们开发体验和效率
*/


