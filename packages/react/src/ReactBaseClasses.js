/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactNoopUpdateQueue from './ReactNoopUpdateQueue';

const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

/**
 * Base class helpers for the updating state of a component.
 */
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

// 组件extends Component 后，会被打伤 isReactComponent 标记，即存在 isReactComponent 属性
Component.prototype.isReactComponent = {};

/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 * 设置子集的状态。总是使用这个来改变状态。你应该对待`this.state`像immutable一样。
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 * 不保证立即更新，所以在调用此方法后访问this.state可能会返回旧值
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 * 不保证调用setState将会同步运行，因为它们可能在最终会被批量合并。
 * 你可以提供一个callback，它将在实际完成调用setState时执行。
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 * 当一个function被提供给setState时，它将在未来某个时候被调用（不是同步的）。
 * 它将被调用当前组件参数（state，props，context）。
 * 这些值可以不同于this.*因为你的function可能在receiveProps后被调用，而不是shouldComponentUpdate之前，
 * 这个新的state，props和context还没有被分配给this。
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
Component.prototype.setState = function(partialState, callback) {
  if (
    typeof partialState !== 'object' &&
    typeof partialState !== 'function' &&
    partialState != null
  ) {
    throw new Error(
      'setState(...): takes an object of state variables to update or a ' +
        'function which returns an object of state variables.',
    );
  }

  // 将state update需求放入updater队列， 标记为setState
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 * 当你知道组件的某个深层状态发生了变化，但是setState没有被调用时，你可以调用这个方法。
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 * 这将不会调用shouldComponentUpdate，但是会调用componentWillUpdate和componentDidUpdate。
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
Component.prototype.forceUpdate = function(callback) {
  // 将callback放入updater队列， 标记为forceUpdate
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if (__DEV__) {
  const deprecatedAPIs = {
    isMounted: [
      'isMounted',
      'Instead, make sure to clean up subscriptions and pending requests in ' +
        'componentWillUnmount to prevent memory leaks.',
    ],
    replaceState: [
      'replaceState',
      'Refactor your code to use setState instead (see ' +
        'https://github.com/facebook/react/issues/3236).',
    ],
  };
  const defineDeprecationWarning = function(methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function() {
        console.warn(
          '%s(...) is deprecated in plain JavaScript React classes. %s',
          info[0],
          info[1],
        );
        return undefined;
      },
    });
  };
  for (const fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;

/**
 * Convenience component with default shallow equality check for sCU.
 */
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
// Avoid an extra prototype jump for these methods.
Object.assign(pureComponentPrototype, Component.prototype);
// PureComponent 与 Component的区别在于， PureComponent 被标记了isPureReactComponent, 这回使 PureComponent不会调用shouldComponentUpdate
pureComponentPrototype.isPureReactComponent = true; 

export {Component, PureComponent};
