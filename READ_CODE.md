# react渲染流程

## React理念

CPU的瓶颈
渲染卡帧问题
IO的瓶颈

JS脚本执行 -----  样式布局 ----- 样式绘制

时间切片
这种将长任务分拆到每一帧中，像蚂蚁搬家一样一次执行一小段任务的操作，被称为时间切片（time slice）

解决CPU瓶颈的关键是实现时间切片，而时间切片的关键是：将同步的更新变为可中断的异步更新。

在浏览器每一帧的时间中，预留一些时间给JS线程，React利用这部分时间更新组件中，预留的初始时间是5ms）

## React16架构可以分为三层

Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
Reconciler（协调器）—— 负责找出变化的组件
Renderer（渲染器）—— 负责将变化的组件渲染到页面上（ReactDom、ReactNative、ReactTest、ReactArt ）

### Scheduler（调度器）

既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。

部分浏览器已经实现了这个API，这就是requestIdleCallback

React实现了功能更完备的requestIdleCallbackpolyfill，这就是Scheduler。除了在空闲时触发回调的功能外，Scheduler还提供了多种调度优先级供任务设置。

### Reconciler（协调器）

React15中递归处理虚拟Dom， React16中可中断循环处理处理虚拟DOM

每次循环都会调用shouldYield判断当前是否有剩余时间。

工作逻辑

Scheduler将任务交给Reconciler后，Reconciler会为变化的虚拟DOM打上代表增/删/更新的标记，类似这样：

```
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
export const PlacementAndUpdate = /*    */ 0b0000000000110;
export const Deletion = /*              */ 0b0000000001000;
```

只有当所有组件都完成Reconciler的工作，才会统一交给Renderer。

Reconciler内部采用了Fiber的架构。

React Fiber可以理解为：

React内部实现的一套状态更新机制。支持任务不同优先级，可中断与恢复，并且恢复后可以复用之前的中间状态。

其中每个任务更新单元为React Element对应的Fiber节点。

### Renderer（渲染器）

Renderer根据Reconciler为虚拟DOM打的标记，同步执行对应的DOM操作。

# Fiber

Fiber包含三层含义：

* 作为架构来说，之前React15的Reconciler采用递归的方式执行，数据保存在递归调用栈中，所以被称为stack Reconciler。React16的Reconciler基于Fiber节点实现，被称为Fiber Reconciler。

* 作为静态的数据结构来说，每个Fiber节点对应一个React element，保存了该组件的类型（函数组件/类组件/原生组件...）、对应的DOM节点等信息。

* 作为动态的工作单元来说，每个Fiber节点保存了本次更新中该组件改变的状态、要执行的工作（需要被删除/被插入页面中/被更新...）。

### Fiber节点如何生产DOM树

Fiber节点生成Fiber树，Fiber树对应DOM树， 最后通过双缓存机制来更新DOM
