# React源码阅读心得

*记录了阅读react源码时的一些总结，帮助掌握理解*

## 目录

1. [关键词](#关键词)
1. [全局变量](#全局变量)
1. [目录结构](#目录结构)
1. [架构流程](#架构流程)

## 关键词

- [1.1]() Fiber

  一个通过自定义数据结构来模拟一个DOM Tree结构的对象。

  它通过child、sibling、return 属性来存放该节点的子集、兄弟节点、父级。通过memoizedProps，memoizedState 存储着这个节点的 props 与 state等。

  其具体结构如下（相比于源码中的Type有补充）：

```javascript
type Fiber = {
  // 标记不同的组件类型，如FunctionComponent 0、ClassComponent 1、HostComponent 5 等
  // 用来在beginWork等环节进行区分处理
  tag: WorkTag,

  // ReactElement里面的key
  // 在diff环节来区分是新建还是复用，以节省性能开销
  key: null | string,

  // TODO:
  elementType: any,

  // TODO:
  type: any,

  // 当前节点对应的DOM节点，为HTMLElement
  stateNode: any,

  // 当前节点的父节点, 为Fiber结构
  // 在completeWork阶段，当处理完当前节点后，向上查找
  return: Fiber | null,

  // 指向自己的第一个子节点 ???
  // 当前节点所有子节点的集合？还是第一个子节点 ？？？
  // TODO:
  child: Fiber | null,

  // 当前节点的兄弟节点，指向右侧的兄弟
  // TODO: 右侧兄弟？
  sibling: Fiber | null,

  // TODO：
  index: number,

  // ref属性
  // 在completeWork阶段使用 ？？？
  ref: null | (((handle: mixed) => void) & {_stringRef: ?string, ...}) | RefObject,

  // ================== 更新相关 ===================
  // 作为动态的工作单元的属性, 保存了本次更新相关的信息

  // 新的变动带来的新的props
  pendingProps: any,
  // 上一次渲染完成之后的props, 即preProps
  memoizedProps: any,
  // 该Fiber对应的Update会存放在这里
  // 当执行setState时，就会产生一个Update
  updateQueue: mixed,
  // 上一次渲染时的state,即preState
  memoizedState: any,
  // TODO:
  dependencies: Dependencies | null,

  // 表示通过哪种方式来渲染，同步or异步
  // 值为NoMode(传统模式)、ConcurrentMode（异步更新）、ProfileMode
  // TODO: 发生在什么时间？
  mode: TypeOfMode,

  // 标识当前Fiber在commit阶段要执行的操作类型，是Update, Placement, Deletion等
  flags: Flags,
  // TODO:
  subtreeFlags: Flags,
  // 待删除的Fiber数组，在？？？中存入，在？？？中执行
  deletions: Array<Fiber> | null,

  // ================ useEffect Hook ==============
  // 下一个useEffect，为单链表结构，帮助快速查找
  // TODO: 整体需要理解一下
  // TODO: 理解
  nextEffect: Fiber | null,
  // 子树中的第一个 useEffect
  firstEffect: Fiber | null,
  // 子树中的最后一个 useEffect
  lastEffect: Fiber | null,

  // =============== Lanes ===================
  // TODO: 通道？？？
  lanes: Lanes,
  childLanes: Lanes,

  // 在Fiber树更新的过程中，每一个Fiber都会有一个跟其对应的Fiber
  // 我们称它`current <=====> workInProgress`
  // current中的fiber即为alternate， 而当前的fiber即为workInProgress中的fiber
  // 在渲染完成之后，他们的位置交换,在commitRoot阶段切换整个Fiber树
  alternate: Fiber | null,
}
```

-[1.2]() WorkInProgress

当前进程中正在处理的Fiber， 与 current 相对应。current 表示当前页面展示的内容所对应的Fiber, 对于当前变更来说，即上一次的最终渲染的Fiber树。 workInProgress为本地变更中的Fiber树，当执行完变更逻辑后，将其赋值给 current, 渲染到页面上去。是双缓存机制中的一环。

-[1.3]() Effects

useEffect ??

-[1.4]() Lane

通道？？？

-[1.5]() Priority

 优先级

-[1.6]() Update

  像Fiber一样，update queue也总是成对出现，一个是current queue，表示屏幕可见的状态，一个是work-in-progress queue，可以在提交前修改并处理异步的工作，这是一种双缓冲的方式。

  两个queue共享一个持久的单链表结构。要调度一个update，我们将它添加到两个queue的末尾。每一个queue都会维护一个指向没有被处理的持久列表中的第一个update的指针。work-in-progress queue指针总是大于或等于当前queue，因为我们总是在工作中。current queue的指针只在提交阶段更新，在我们交换work-in-progress时

  update 不是按照 priority 排序的，而是按照插入顺序。新的update总是被添加到列表的末尾。priority 任然是重要的，当在render阶段处理update queue时，只有具有足够优先级（priority）的update才会被包含在结果中。如果我们因为没有足够的优先级priority而跳过一个update，它将保留在队列中，以便在下一个低优先级render中处理。

  通过 `createUpdate` 来初始化一个无内容的Update

  ```javascript
  createUpdate(eventTime: number, lane: Lane): Update<*>
  ```

  ```javascript
  type Update = {
    //
    eventTime: number,

    lane: Lane,

    // 指定更新的类型，值为UpdateState 0, ReplaceState 1, ForceUpdate 2, CaptureUpdate 3
    tag: 0 | 1 | 2 | 3,
    // 更新内容，setState 接收的第一个参数
    payload: any,
    // 更新后执行的回调，setState 接收的第二个参数，会传入 preProps,preState
    callback: (() => mixed) | null,
    // 指向下一个更新
    next: Update<State> | null,
    // TODO: ??
    nextEffect: Update<State> | null
  }

  ```

-[1.6]() UpdateQueue

用来存放Update的队列，通过调用enqueueUpdate来往UpdateQueue中放入Update, 通过调用processUpdateQueue 来处理 UpdateQueue 中的 Update。

```javascript
enqueueUpdate(fiber: Fiber, update: Update<State>, lane: Lane)

processUpdateQueue(workInProgress: Fiber, props: any, instance: any, renderLanes: Lanes)
```

```javascript
type UpdateQueue = {
  // 每次操作完更新之后的`state` ?? 不是之前 ？？
  baseState: State,
  // 队列中的第一个`Update`
  firstBaseUpdate: Update<State> | null,
  // 
  lastBaseUpdate: Update<State> | null,
  // 
  shared: SharedQueue<State>,
  // 
  effects: Array<Update<State>> | null,
}

```

-[1.7]() Context

**[⬆ 回到顶部](#目录)**

## 全局变量

- [1.1]() isWorking

  commitRoot和renderRoot开始都会设置为true，然后在他们各自阶段结束的时候都重置为false

  **用来标志是否当前有更新正在进行，不区分阶段**

- [1.2]() nextUnitOfWork

  用于记录render阶段Fiber树遍历过程中下一个需要执行的节点。为一个Fiber

  在resetStack中分别被重置

  他只会指向workInProgress

- [1.3]() nextEffect

  用于 commit 阶段记录 firstEffect -> lastEffect 链遍历过程中的每一个Fiber

- [1.4]() isRendering

  performWorkOnRoot开始设置为true，结束的时候设置为false，表示进入渲染阶段，这是包含render和commit阶段的。
  
- [1.5]() nextFlushedRoot & nextFlushedExpirationTime

  用来标志下一个需要渲染的 root 和对应的 expirtaionTime，注意：
  - 通过 findHighestPriorityRoot 找到最高优先级的
  - 通过 flushRoot 会直接设置指定的，不进行筛选
  
**[⬆ 回到顶部](#目录)**

## 目录结构

- [3.1]() [整体目录](https://react.iamkasong.com/preparation/file.html#%E9%A1%B6%E5%B1%82%E7%9B%AE%E5%BD%95)

- [3.2]() react-reconciler 文件夹

用来管理react的处理逻辑，包括diff算法、update操作等

```javascript
├── ReactChildFiber.js              //
├── ReactCurrentFiber.js            //
├── ReactEventPriorities.js
├── ReactFiber.js                   //    
├── ReactFiberBeginWork.js          // beginWork相关的方法，包括reconcileChildren
├── ReactCurrentFiber.js
├── ReactFiberCacheComponent.js
├── ReactFiberClassComponent.js
├── ReactFiberCommitWork.js
├── ReactFiberCompleteWork.js
├── ReactFiberComponentStack.js
├── ReactFiberContext.js
├── ReactFiberErrorDialog.js
├── ReactFiberErrorLogger.js
├── ReactFiberFlags.js
├── ReactFiberHooks.js
├── ReactFiberHostConfig.js
├── ReactFiberHostContext.old.js
├── ReactFiberHotReloading.js
├── ReactFiberHydrationContext.js
├── ReactFiberInterleavedUpdates.js
├── ReactFiberLane.js
├── ReactFiberLazyComponent.js
├── ReactFiberNewContext.js
├── ReactFiberOffscreenComponent.js
├── ReactFiberReconciler.js
├── ReactFiberRoot.js
├── ReactFiberScope.js
├── ReactFiberStack.js
├── ReactFiberSuspenseComponent.js
├── ReactFiberSuspenseContext.js
├── ReactFiberSyncTaskQueue.js
├── ReactFiberThrow.js
├── ReactFiberTransition.js
├── ReactFiberTreeReflection.js
├── ReactFiberUnwindWork.js
├── ReactFiberWorkLoop.js
├── ReactHookEffectTags.js
├── ReactInternalTypes.js
├── ReactMutableSource.js
├── ReactPortal.js
├── ReactProfilerTimer.js
├── ReactReconcilerConstants.js
├── ReactRootTags.js
├── ReactStrictModeWarnings.js
├── ReactTestSelectors.js
├── ReactTypeOfMode.js
├── ReactUpdateQueue.js
├── ReactWorkTags.js
├── Scheduler.js
└── SchedulingProfiler.js
```

render阶段相关文件夹

```javascript

```

commit阶段相关文件夹

```javascript

```

**[⬆ 回到顶部](#目录)**

## 项目架构

- [4.1]() 架构

  React16架构可以分为三层：

  - Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler

  - Reconciler（协调器）—— 负责找出变化的组件

  - Renderer（渲染器）—— 负责将变化的组件渲染到页面上

- [4.2]() Scheduler（调度器）

  既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。Scheduler 是 React 实现的替代 浏览器原生API requestIdleCallback 的一个调度器。除了在空闲时触发回调的功能外，Scheduler还提供了多种调度优先级供任务设置。

  Scheduler (opens new window)是独立于React的库

- [4.3]() **Reconciler（协调器**）

  可中断循环递归处理虚拟DOM的（即Fiber），每次循环都会调用shouldYield判断当前是否有剩余时间。

  其通过接收props、state的更改需求，通过diff算法，计算出需要变更的DOM节点，为其对应的Fiber打上相应的flags(如Update、Placement, Deletion等)

- [4.4]() Renderer（渲染器）

  Renderer根据Reconciler为虚拟DOM打的标记，同步执行对应的DOM操作。Renderer中会根据应用的不同调用 react-dom、react-native、react-art 中封装方法，将instance渲染到页面上。其方法如 updateProperties、appendChild 等

- [4.5]() 流程

  整个项目流程的入口是 ReactDOM.render 方法，然后进入 reconciler 流程。reconciler 分为 render 阶段 与 commit 阶段。

- [4.6]() before mutation阶段（执行DOM操作前）

  1. 处理DOM节点渲染/删除后的 autoFocus、blur 逻辑。

  1. `调用getSnapshotBeforeUpdate、componentWillUnmount生命周期钩子`。

  1. `调度useEffect`。  // TODO:

- [4.7]() mutation阶段（执行DOM操作）

  mutation阶段会遍历effectList，依次执行commitMutationEffects。该方法的主要工作为“根据flags调用不同的处理函数处理Fiber, 包括Placement | Update | Deletion。

  在此阶段会调用react-dom的 appendChild 等方法，将Fiber的内容渲染到DOM上。

- [4.7]() layout阶段（执行DOM操作后）

  该阶段的代码都是在DOM渲染完成（mutation阶段完成）后执行的。

  `在该阶段调用了声明周期钩子，如componentDidMount、 componentUpdateMount`

- [4.8]() render阶段

  render 阶段开始于 performSyncWorkOnRoot 或 performConcurrentWorkOnRoot 方法的调用。这取决于本次更新是同步更新还是异步更新。

  render 阶段主要工作是 基于 DOM节点（HTMlElement 类型）创建了对应的 Fiber（即虚拟DOM）， 然后通过操作Fiber来实现props、state的更新等操作。

  render 阶段主要实现的是 通过 深度优先遍历 创建出一颗 Fiber 树，并在该 Fiber 树的每个节点打上 操作的标记， 如执行Update、Deletion等操作。并将要执行的 变更以Update的数据结构存入 UpdateQueue中。

  深度优先遍历走的是一个 beginWork阶段 与 completeWork阶段

- [4.9]() commit阶段

  commit 阶段，识别Fiber上的标记，根据对应的DOM方法执行对应节点的更新操作，将其渲染到页面（真实DOM）上。该阶段又可拆分为3个小阶段，分别是
  
  - before mutation阶段（执行DOM操作前）

  - mutation阶段（执行DOM操作）

  - layout阶段（执行DOM操作后）

  在该阶段执行react在Component中暴露的钩子，如componentDidMount、componentUpdateMount、componentWillUnMount等。

  涉及到比如useEffect的触发、优先级相关的重置、ref的绑定/解绑。

- [4.10]() beginWork阶段
    1. next为beginWork传入的当前节点fiber后创建的新的子节点fiber，该子节点会被赋值给 workInProgress.child
    1. 创建子节点的过程分为 直接复用子节点与创建新的子节点。
    1. 创建新的子节点分为mount阶段与update阶段创建，通过reconcileChildren函数来创建的。
    1. 其中update阶段执行reconcileChildren，会在其中进行diff算法来进行子节点的创意，以适当复用，减小性能开销
    1. beginWork创建的子节点，fiber.effectsTag会被赋值为Placement、Update、PlacementAndUpdate、Deletion，表示在最后的commitRender阶段义哪种方式将fiber.stateNode(DOM节点格式)插入DOM树中
    1. update阶段会给fiber.effectsTag赋值，mount阶段则不会，而是统一在rootFiber上赋值Placement effectTag

- [4.11]() completeWork阶段

  1. completeWork是一个递归函数，会把当前Fiber的子Fiber全部执行完毕，然后再执行当前Fiber
  2. 通过prepareUpdate 来更新 DOM节点上的属性，如onClick、onChange等回调函数的注册、处理style prop、处理DANGEROUSLY_SET_INNER_HTML prop， 处理children prop
  3. 被处理完的props会被赋值给workInProgress.updateQueue，并最终会在commit阶段被渲染在页面上
  4. 每个执行完completeWork且存在effectTag的Fiber节点会被保存在一条被称为effectList的单向链表中 ???

**[⬆ 回到顶部](#目录)**
