
import {createAppAPI} from './createAppAPI'

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
    setScopeId: hostSetScopeId ,
  } = options
  // 核心调度逻辑
  function patch(){

  }

  //处理组件
  function processComponent(){}
  // 处理html元素
  function processElement(){}
  // 处理文本元素
  function processText(){}
  // 更新组件
  function updateComponent(){}
  // 更新html元素
  function updateElement(){}
  //挂载组件
  function mountComponent(){}
  // 挂载html元素
  function mountElement(){}
  // 挂载children
  function mountChildren(){}
  // 卸载/删除vnode
  function unmount(){}
  function unmountComponent(){}
  // patch组元素
  function patchChildren(){}
  function patchKeyedChildren(){}
  //设置setup函数
  function setupRenderEffect(){}
  //组件预渲染
  function updateComponentPreRender(){}

  function render(vnode,container){
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