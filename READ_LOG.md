# react-dom

## createRoot

这个是react的第一步

```jsx
import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### createRoot

1. 基于rootContainerElement创建一个`FiberRoot`
2. 为rootContainerElement添加一个__reactContainer属性，其值为root.current
3. 为rootContainerElement绑定所有原生事件的监听器， 默认监听捕获阶段Event

### root.render

1. 将children添加到rootContainerElement上
2. 这里是通过updateContainer将添加节点的需求添加到enqueueUpdate中，在任务队列中执行的
