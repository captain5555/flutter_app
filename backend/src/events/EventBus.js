/**
 * 简单的事件总线实现
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  on(event, handler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  /**
   * 订阅一次事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  once(event, handler) {
    const onceHandler = (...args) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} handler - 要取消的处理函数
   */
  off(event, handler) {
    if (!this.events[event]) return;

    if (handler) {
      this.events[event] = this.events[event].filter(h => h !== handler);
    } else {
      delete this.events[event];
    }
  }

  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (!this.events[event]) return;

    this.events[event].forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Error in event handler for ${event}:`, err);
      }
    });
  }

  /**
   * 异步发布事件（不等待处理完成）
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emitAsync(event, data) {
    setImmediate(() => this.emit(event, data));
  }

  /**
   * 获取所有订阅的事件
   */
  getEventNames() {
    return Object.keys(this.events);
  }

  /**
   * 清除所有订阅
   */
  clear() {
    this.events = {};
  }
}

module.exports = EventBus;
