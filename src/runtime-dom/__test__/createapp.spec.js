import { createApp } from '../';

describe('createApp', () => {
  it('createApp', () => {
    const Comp = {
      render() {
        return h('div', null, 'createApp');
      },
    };
    const root = document.createElement('div');
    createApp(Comp).mount(root);
    expect(root.innerHTML).toBe('<div>createApp</div>');
  });
});