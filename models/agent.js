// models/agent.js
import {Step} from './step.js';
import {createLogger} from '../scripts/logger.js';
const logger = createLogger ('agent.js');

export class Agent {
  constructor({
    id,
    name,
    description,
    steps,
    ownerId,
    createdBy,
    lastUpdatedBy,
    creationTime,
    lastUpdateTime,
    tags,
    category,
    version,
    likes = 0,
    downloads = 0,
    isPublic = false,
    triggers,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.steps = steps; // Array of Step objects
    this.ownerId = ownerId;
    this.createdBy = createdBy;
    this.lastUpdatedBy = lastUpdatedBy;
    this.creationTime = creationTime;
    this.lastUpdateTime = lastUpdateTime;
    this.tags = tags;
    this.category = category;
    this.version = version;
    this.likes = likes;
    this.downloads = downloads;
    this.isPublic = isPublic;
    this.triggers = triggers; // Array of Trigger objects
  }

  static fromJSON (json) {
    return new Agent ({
      ...json,
      steps: json.steps.map (Step.fromJSON),
      triggers: json.triggers.map (Trigger.fromJSON),
    });
  }

  toJSON () {
    return {
      ...this,
      steps: this.steps.map (step => step.toJSON ()),
    };
  }
}

export class Trigger {
  constructor({
    type, // 'url', 'element_type', 'specific_element'
    condition,
  }) {
    this.type = type;
    this.condition = condition;
  }

  static fromJSON (json) {
    return new Trigger (json);
  }

  toJSON () {
    return {...this};
  }
}
