import { Store, createStore } from 'vuex';

// export default createStore({
//   state: {},
//   mutations: {},
//   actions: {},
//   modules: {},
// });

export default function(): Store<any> {
  return createStore({
    state: () => ({
      hello: 'world',
    }),
    mutations: {},
    actions: {},
    modules: {},
  });
}
