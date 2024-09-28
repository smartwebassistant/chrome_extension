// services/agentExecutor.js

import {STORAGE_KEYS} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';
import {Tool} from '../models/tool.js';

const logger = createLogger ('agentExecutor.js');

export class AgentExecutor {
  async executeAgent (request) {
    logger.debug ('Executing agent:', request);
    // throw error if no agent id is provided or context is not provided
    if (!request.data) {
      throw new Error ('Data is required.');
    }
    const data = request.data;
    if (!data.agentId) {
      throw new Error ('Agent ID is required.');
    }
    if (!data.context) {
      throw new Error ('Context is required.');
    }
    // get agent id from request
    const agentId = data.agentId;
    // get agent from storage
    const agent = await getAgentById (agentId);

    if (!agent) {
      logger.error (`Agent not found with ID: ${agentId}`);
      throw new Error (`Agent not found with ID: ${agentId}`);
    }

    let context = data.context || {};
    // execute agent steps
    for (const step of agent.steps) {
      logger.debug (`Executing step: ${step.id}`);
      context = await this.executeStep (step, context);
    }

    logger.debug ('Agent execution completed successfully');
    return response;
  }
  catch (error) {
    logger.error ('Error executing agent:', error);
    throw error;
  }

  async executeStep (step, context) {
    logger.debug (`Executing step: ${step.id}`);

    const input = this.resolveInput (step.input, context);
    const tool = new Tool (step.tool);

    try {
      const output = await tool.execute (input);
      return this.processOutput (step.output, output, context);
    } catch (error) {
      logger.error (`Error executing step ${step.id}:`, error);
      throw error;
    }
  }

  resolveInput (input, context) {
    if (typeof input === 'string') {
      return input.replace (
        /\${(.*?)}/g,
        (match, key) => context[key] || match
      );
    } else if (typeof input === 'object') {
      return Object.entries (input).reduce ((acc, [key, value]) => {
        acc[key] = this.resolveInput (value, context);
        return acc;
      }, {});
    }
    return input;
  }
  catch (error) {
    logger.error ('Error resolving input:', error);
    throw error;
  }

  processOutput (outputConfig, stepOutput, context) {
    logger.debug ('Processing output:', outputConfig, stepOutput, context);
    try {
      const response = {
        ...context,
        [outputConfig.key]: stepOutput,
      };
      logger.debug ('Output processed:', response);
      return response;
    } catch (error) {
      logger.error ('Error processing output:', error);
      throw error;
    }
  }
}

function getAgentById (agentId) {
  return new Promise ((resolve, reject) => {
    chrome.storage.local.get (STORAGE_KEYS.AGENTS, result => {
      if (chrome.runtime.lastError) {
        logger.error ('Error accessing storage:', chrome.runtime.lastError);
        reject (
          new Error (
            `Failed to access storage: ${chrome.runtime.lastError.message}`
          )
        );
        return;
      }

      const agents = result[STORAGE_KEYS.AGENTS] || [];
      const agent = agents.find (agent => agent.id === agentId);

      if (agent) {
        logger.debug (`Agent found: ${agentId}`);
        resolve (agent);
      } else {
        logger.warn (`Agent not found: ${agentId}`);
        resolve (null);
      }
    });
  });
}
