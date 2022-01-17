import { createApp,h } from '../'
describe('createApp', () => {
  it('createApp', () => {
    const Comp = {
      render() {
        return h('div', null, 'createApp')
      },
    }
    const root = document.createElement('div')
    const vm = createApp(Comp)
    vm.mount(root)
    expect(root.innerHTML).toBe('<div>createApp</div>')
  })
})