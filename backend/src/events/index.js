const EventBus = require('./EventBus');
const events = require('./events');

const eventBus = new EventBus();

module.exports = {
  eventBus,
  events,
  EventBus
};
