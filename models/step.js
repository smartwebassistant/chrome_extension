// models/step.js
import {Tool} from './tool.js';
import {createLogger} from '../scripts/logger.js';
const logger = createLogger ('step.js');

export class Step {
  constructor({id, name, description, tool, input, output, condition}) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.tool = tool; // Instance of Tool class
    this.input = input; // Can be static or dynamic (referencing output from previous steps)
    this.output = output; // Defines how the output of this step should be handled
    this.condition = condition; // Optional: Condition to determine if this step should be executed
  }

  static fromJSON (json) {
    return new Step ({
      ...json,
      tool: Tool.fromJSON (json.tool),
    });
  }

  toJSON () {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tool: this.tool.toJSON (),
      input: this.input,
      output: this.output,
      condition: this.condition,
    };
  }

  // Method to check if the step should be executed based on its condition
  shouldExecute (context) {
    if (!this.condition) return true; // Always execute if no condition is set
    // Evaluate the condition based on the current context
    // This is a simple implementation; you might want to use a more sophisticated expression evaluator
    return new Function ('context', `return ${this.condition}`) (context);
  }

  // Method to prepare input for the tool based on the current context
  prepareInput (context) {
    if (typeof this.input === 'string') {
      // If input is a string, treat it as a template and replace placeholders
      return this.input.replace (/\${(.*?)}/g, (match, p1) => {
        return p1.split ('.').reduce ((o, i) => o[i], context);
      });
    } else if (typeof this.input === 'object') {
      // If input is an object, resolve each value from the context
      return Object.entries (this.input).reduce ((acc, [key, value]) => {
        acc[key] = value.split ('.').reduce ((o, i) => o[i], context);
        return acc;
      }, {});
    }
    // If input is neither string nor object, return as is
    return this.input;
  }
}
