
import { createAppAPI } from './createAppAPI'
import {setCurrentInstance} from './component'
import {queueJob} from './scheduler'
import {isSameVNodeType} from './vnode'
export function createRenderer(options) {

  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId,
  } = options
  // 核心调度逻辑
  // n1和n2是新老虚拟dom元素
  function patch(n1, n2, container) {
    if(n1==n2){
      return 
    }
    if(n1 && isSameVNodeType(n1,n2)){
      //n1和n2类型不同 直接销毁n1 挂载n2
      unmount(n1)
      n1 = null
    }
    const { type, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      // 还有注释，fragment之类的可以处理，这里忽略
      default:
        // 通过shapeFlag判断类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container)
        }
    }
  }

  //处理组件
  function processComponent(n1, n2, container) {
    // 老规矩，么有n1就是mount
    if (!n1) {
      // 初始化 component
      mountComponent(n2, container)
    } else {
      updateComponent(n1, n2, container)
    }
  }
  // 处理html元素
  function processElement(n1, n2, container, anchor) {
    if (!n1) {
      mountElement(n2, container, anchor)
    } else {
      // todo
      updateElement(n1, n2, container, anchor)
    }
  }
  // 处理文本元素
  function processText(n1, n2, container) {
    if (n1 === null) {
      // 新增文本
      n2.el = hostCreateText(n2.children)
      hostInsert(n2.el, container)
    } else {
      if (n1.children !== n2.children) {
        n2.el = n1.el
        // 文本不同，更新文本
        hostSetText(n2.el, n2.children)
      }
    }
  }
  function shouldComponentUpdate(prevVnode,nextVnode){
    const prev = prevVnode.props
    const next = nextVnode.props
    if(prev===next){
      return false
    }
    return true
    // @todo 对比props 没有变化就不需要更新，遍历一波
    // https://github.com/vuejs/vue-next/blob/a31303f835f47c7aa5932267342a2cc2b21db948/packages/runtime-core/src/componentRenderUtils.ts#L321
  }
  // 更新组件
  function updateComponent(n1,n2,container) { 
    n2.component = n1.component
    if(shouldComponentUpdate(n1,n2)){
      // 需要更新
      instance.next = n2
      // setupRenderEffect里面注册的update方法
      // next里面调用patch
      instance.update() // 注册的更新函数
    }else{
      // 不需要更新 简单覆盖一下属性
      n2.component = n1.component
      instance.vnode = n2
    }
  }
  // 更新html元素
  function updateElement(n1, n2, container) {
    const oldProps = n1?.props || {}
    const newProps = n2.props || {}

    n2.el = n1.el
    // @todo 根据patchProps判断class style等属性
    patchProps(el, oldProps, newProps)

    // 对比 children
    patchChildren(n1, n2, el, container)

  }

  function patchProps(el, oldProps, newProps) {
    // 遍历newprops，覆盖old props
    // @todo 属性兼容性问题
    for (const key in newProps) {
      const prev = oldProps[key]
      const next = newProps[key]
      if (prev !== next) {
        hostPatchProp(el, key, prev, next)
      }
    }
    // 遍历oldprops，如果new props中没有就删除
    for (const key in oldProps) {
      const prev = oldProps[key]
      if (!prev in newProps) {
        hostPatchProp(el, key, prev, null)
      }
    }
  }
  //挂载组件
  function mountComponent(vnode, container) {
    // 创建组件实例，其实就是个对象，包含组件的各种属性
    const instance = vnode.component = {
      vnode,
      type:vnode.tyope,
      props:vnode.props,
      setupState:{}, //响应式状态
      slots:{},
      ctx:{},
      emit:()=>{}
    }
    // 启动setup函数中的各种响应式数据
    setupComponent(instance)

    setupRenderEffect(instance, initialVNode, container)
  }
  
  //组件预渲染
  function setupComponent(instance) {
    const { props, children } = instance.vnode
    // 其实还需要处理slot，根据flags 这里忽略一下下@todo
    // initSlots(instance, children) 
    // 只考虑了composition语法的setup函数
    const component = instance.type
    // script setup写的函数都在setup内部
    const { setup } = component
    // 设置正在处理的componeng实例 
    setCurrentInstance(instance)
    // 所以setup函数内部就可以通过getCurrrntInstance获取当前组件的实例
    const setupContext = {
      attrs:instance.attrs,
      slots:instance.slots,
      emit:instance.emit // @todo 还没实现emit
    }
    // 不用script setup，setup中的参数就是来源这里
    // export default {
    //   setup(props,{attr,slots,emit})
    // }
    const setupResult =setup(instance.props, setupContext)
    setCurrentInstance(null)
    instance.ctx = {
      ...instance.props,
      ...instance.setupState,
    }
    // setup函数返回的数据，需要传递给template使用
    // 如果返回的是函数，就是render函数处理，不需要template了
    if (typeof setupResult === "function") {
      instance.render = setupResult
    }else{
      instance.setupState = setupResult
    }
    // 如果没有render并且又template，需要把template处理成render函数
    // render函数的目的就是返回虚拟dom，compiler就是compiler模块需要实现的
    if (!Component.render && Component.template) {
      let { template } = Component
      if (template[0] === '#') {
        const el = document.querySelector(template)
        template = el ? el.innerHTML : ''
      }
      Component.render = new Function('ctx', compile(template))
    }
    
   }

//设置setup函数
function setupRenderEffect(instance,container,) { 
  instance.update = effect(componentEffect, {
    scheduler: () => {
      queueJob(instance.update)
    },
  })

  function componentEffect(){
    //加载了 
    if(instance.isMounted){
      const {vnode,next} = instance
      if (next) {
        next.el = vnode.el
        // 更新组件的props和slots等
        instance.props = next.props
        instance.slots = next.slots        
      }
      const nextTree = (instance.subTree = instance.render(instance.ctx))
      patch(instance.subTree, nextTree, container)
    }else{
      // 还没挂载
      const subTree = (instance.subTree = normalizeVNode(
        Component.render(instance.ctx)
      ))
      patch(null, subTree, container)
      instance.isMounted = true
    }
  }
}

  // 挂载html元素
  function mountElement(vnode, container, anchor) {
    const { shapeFlag, props, children, type } = vnode
    vnode.el = hostCreateElement(type)
    // 支持单子组件和多子组件的创建
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 子元素是childern
      hostSetElementText(n2.el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 是一个数组，比如多个div元素
      mountChildren(vnode.children, el)
    }
    // 新增props
    if (props) {
      for (const key in props) {
        const nextVal = props[key]
        hostPatchProp(el, key, null, nextVal)
      }
    }
    hostInsert(vnode.el, container, anchor)

  }
  // 挂载children
  function mountChildren(children, container) {
    // 子元素啥类型都有可能 挨个patch 
    children.forEach((child) => {
      patch(null, child, container)
    })
  }
  // 卸载/删除vnode
  function unmount(vnode) {
    const { shapeFlag, el } = vnode
    if (shapeFlag & ShapeFlags.COMPONENT) {
      unmountComponent(vnode)
    } else {
      // 调用runtime-dom的删除子元素方法 卸载
      hostRemove(el)
    }
  }

  function unmountComponent(vnode) {
    unmount(vnode.component.subTree)
  }
  // patch组元素 复杂的逻辑
  function patchChildren(n1, n2, container) {
    const prevFlag = n1.shapeFlag
    const c1 = n1.children
    const nextFlag = n1.shapeFlag
    const c2 = n1.children

    // 新的vdom是文本
    if (nextFlag & ShapeFlags.TEXT_CHILDREN) {
      if(prevFlag & ShapeFlags.ARRAY_CHILDREN){
        // 老的vdom是数组。unmount
        c1.forEach(child=>unmount(child))
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2)
      }
    } else {
      // 老的vdom是数组
      if (prevFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的vdom也是数组，
        if (nextFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 最简单粗暴的方法就是unmountChildren(c1), 再mountChildren(c2)
          // 这样所有dom都没法复用了

          // 这里也有两种情况，没写key和写了key, key就想虚拟dom的身份证让
          // 在新老数组中的虚拟dom的key相同，就默认可以复用dom
          // <li :key="xx"></li>
          if(c1[0].key && c2[0].key){
            patchKeyedChildren(c1, c2, container, anchor, parentComponent)

          }else{
            // 么有key，只能暴力复用一个类型的dom
            patchUnKeyedChildren(c1, c2, container, anchor, parentComponent)
          }
        }else{
          // next是null
          unmountChildren(c1)
        }
      }else{
        if (nextFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, container)
        }
      }
    }
   }
  function patchKeyedChildren(c1, c2, container, ) { 
    // 最复杂的就是这里了，每个元素都有key，都能判断出是否需要复用
    // 需要做的就是找到最短的操作路径,全部代码见github
    // https://github.com/vuejs/vue-next/blob/a31303f835f47c7aa5932267342a2cc2b21db948/packages/runtime-core/src/renderer.ts#L1762

  }
  function patchUnKeyedChildren(c1, c2, container) {
    // v-for或者多个子元素没写key
    // prev: a b c d 
    // new:  a c d e f g 
    // 由于没写key，无从判断a c d是否复用，只能是默认索引位置一样的dom复用
    // a复用，b和c如果一样的html标签，就复用标签，  c和d，d和e，然后f和g新增
    // 这里cd其实是可以服用的，不过没有key导致了性能的浪费，这也是为啥要写key

    const oldLen = c1.length
    const newLen = c2.length
    const len = Math.min(oldLen, newLen)
    for (let i = 0 ;i < len; i++) {
      patch(c1[i], c2[i], container) // 挨个复用 
    }
    if (newLen > oldLen) {
      mountChildren(c2.slice(len), container)
    } else if (newLen < oldLen) {
      unmountChildren(c1.slice(len))
    }
  }

  function render(vnode, container) {
    const preVNode = container._vnode
    if (vnode == null) {
      if (preVNode) {
        unmount(preVNode) // 传递vnode是null，直接全部卸载
      }
    } else {
      // 调用patch
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode // 缓存vnode，作为下次render的prev
  }
  return {
    createApp: createAppAPI(render)
  }
}