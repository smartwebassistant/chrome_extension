// services/agentRepository.js
import {Agent} from '../models/agent.js';

export class AgentRepository {
  constructor (apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async searchAgents (query) {
    const response = await fetch (
      `${this.apiBaseUrl}/agents/search?q=${encodeURIComponent (query)}`
    );
    const data = await response.json ();
    return data.map (Agent.fromJSON);
  }

  async searchAgentsForTrigger (url, elementType, elementSelector) {
    const params = new URLSearchParams ({
      url,
      elementType,
      elementSelector,
    });
    const response = await fetch (
      `${this.apiBaseUrl}/agents/search/trigger?${params}`
    );
    const data = await response.json ();
    return data.map (Agent.fromJSON);
  }

  async uploadAgent (agent) {
    const response = await fetch (`${this.apiBaseUrl}/agents`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify (agent),
    });
    return Agent.fromJSON (await response.json ());
  }

  async downloadAgent (agentId) {
    const response = await fetch (`${this.apiBaseUrl}/agents/${agentId}`);
    const data = await response.json ();
    return Agent.fromJSON (data);
  }

  async likeAgent (agentId) {
    const response = await fetch (`${this.apiBaseUrl}/agents/${agentId}/like`, {
      method: 'POST',
    });
    return await response.json ();
  }

  async getPopularAgents () {
    const response = await fetch (`${this.apiBaseUrl}/agents/popular`);
    const data = await response.json ();
    return data.map (Agent.fromJSON);
  }
}
