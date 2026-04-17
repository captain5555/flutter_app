const BaseModel = require('./BaseModel');

class AISettingsModel extends BaseModel {
  async getAISettings() {
    const row = await this.get(
      'SELECT * FROM ai_settings WHERE id = ?',
      ['global']
    );
    return row || {
      api_url: '',
      api_key: '',
      model: '',
      title_prompt: '',
      description_prompt: '',
      safety_rules: '',
      replacement_words: ''
    };
  }

  async saveAISettings(settings) {
    const { api_url, api_key, model, title_prompt, description_prompt, safety_rules, replacement_words } = settings;
    await this.run(
      `INSERT OR REPLACE INTO ai_settings
       (id, api_url, api_key, model, title_prompt, description_prompt, safety_rules, replacement_words, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      ['global', api_url || '', api_key || '', model || '', title_prompt || '', description_prompt || '', safety_rules || '', replacement_words || '']
    );
    return { success: true };
  }
}

module.exports = AISettingsModel;
