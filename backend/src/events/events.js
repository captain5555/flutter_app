/**
 * 事件类型常量
 */
module.exports = {
  // Material events
  MATERIAL_CREATED: 'material:created',
  MATERIAL_UPDATED: 'material:updated',
  MATERIAL_DELETED: 'material:deleted',
  MATERIAL_TRASHED: 'material:trashed',
  MATERIAL_RESTORED: 'material:restored',
  MATERIAL_BATCH_TRASHED: 'material:batch-trashed',
  MATERIAL_BATCH_RESTORED: 'material:batch-restored',
  MATERIAL_BATCH_DELETED: 'material:batch-deleted',
  MATERIAL_BATCH_COPIED: 'material:batch-copied',
  MATERIAL_BATCH_MOVED: 'material:batch-moved',

  // User events
  USER_CREATED: 'user:created',
  USER_UPDATED: 'user:updated',
  USER_DELETED: 'user:deleted',

  // System events
  SYSTEM_STARTUP: 'system:startup',
  SYSTEM_SHUTDOWN: 'system:shutdown'
};
