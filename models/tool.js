import {createLogger} from '../scripts/logger.js';
const logger = createLogger ('tool.js');
import {fetchOpenAI} from '../scripts/api.js';

export class Tool {
  constructor (toolConfig) {
    this.id = toolConfig.id;
    this.name = toolConfig.name;
    this.description = toolConfig.description;
    this.type = toolConfig.type;
    this.config = toolConfig.config;
  }

  async execute (input) {
    switch (this.id) {
      case 'tool_001':
        return this.executeWebScraper (input);
      case 'tool_101':
        return this.executeChatCompletion (input);
      case 'tool_002':
        return this.executeDOMManipulator (input);
      default:
        throw new Error (`Unknown tool type: ${this.type}`);
    }
  }

  static fromJSON (json) {
    return new Tool (json);
  }

  toJSON () {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      config: this.config,
    };
  }

  async executeWebScraper (input) {
    logger.debug ('Executing web scraper:', input);
    // Implement web scraping logic here
    return input;
  }

  async executeChatCompletion (input) {
    logger.debug ('Executing LLM:', input);
    // await fetchOpenAI api then return the result
    const response = await fetchOpenAI (input.system_prompt, input.user_prompt);
    return response;
  }

  async executeDOMManipulator (input) {
    logger.debug ('Executing DOM manipulator:', input);
    const request = {action: 'content.fillText', content: input.content};
    chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
      let activeTab = tabs[0];
      chrome.tabs.sendMessage (activeTab.id, request, function (response) {
        console.log ('Response from content script:', response);
      });
    });
    return {status: 'success', message: 'Reply filled in successfully'};
  }
}
