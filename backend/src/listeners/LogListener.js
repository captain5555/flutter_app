/**
 * 日志监听器 - 监听事件并记录操作日志
 */
const db = require('../config/database');
const { events } = require('../events');

class LogListener {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    const { eventBus } = require('../events');

    // 监听素材操作事件
    eventBus.on(events.MATERIAL_CREATED, (data) => {
      this.logMaterialOperation('upload_material', data);
    });

    eventBus.on(events.MATERIAL_UPDATED, (data) => {
      this.logMaterialOperation('update_material', data);
    });

    eventBus.on(events.MATERIAL_TRASHED, (data) => {
      this.logMaterialOperation('trash_material', data);
    });

    eventBus.on(events.MATERIAL_RESTORED, (data) => {
      this.logMaterialOperation('restore_material', data);
    });

    eventBus.on(events.MATERIAL_BATCH_TRASHED, (data) => {
      this.logBatchOperation('batch_trash', data);
    });

    eventBus.on(events.MATERIAL_BATCH_RESTORED, (data) => {
      this.logBatchOperation('batch_restore', data);
    });

    eventBus.on(events.MATERIAL_BATCH_DELETED, (data) => {
      this.logBatchOperation('batch_delete', data);
    });

    eventBus.on(events.MATERIAL_BATCH_COPIED, (data) => {
      this.logBatchOperation('batch_copy', data);
    });

    eventBus.on(events.MATERIAL_BATCH_MOVED, (data) => {
      this.logBatchOperation('batch_move', data);
    });

    // 监听用户操作事件
    eventBus.on(events.USER_CREATED, (data) => {
      this.logUserOperation('create_user', data);
    });

    eventBus.on(events.USER_UPDATED, (data) => {
      this.logUserOperation('update_user', data);
    });

    eventBus.on(events.USER_DELETED, (data) => {
      this.logUserOperation('delete_user', data);
    });
  }

  async logMaterialOperation(action, data) {
    try {
      const { user, material, ip } = data;
      await db.createLog({
        user_id: user.id,
        action,
        target_type: 'material',
        target_id: material?.id,
        details: material?.file_name || null,
        ip_address: ip
      });
    } catch (err) {
      console.error('Failed to log material operation:', err);
    }
  }

  async logBatchOperation(action, data) {
    try {
      const { user, ids, details, ip } = data;
      await db.createLog({
        user_id: user.id,
        action,
        target_type: 'material',
        target_id: null,
        details: details || `${ids?.length || 0} materials`,
        ip_address: ip
      });
    } catch (err) {
      console.error('Failed to log batch operation:', err);
    }
  }

  async logUserOperation(action, data) {
    try {
      const { user, targetUser, ip } = data;
      await db.createLog({
        user_id: user.id,
        action,
        target_type: 'user',
        target_id: targetUser?.id,
        details: targetUser?.username || null,
        ip_address: ip
      });
    } catch (err) {
      console.error('Failed to log user operation:', err);
    }
  }
}

module.exports = LogListener;
