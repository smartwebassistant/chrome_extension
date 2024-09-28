// ui/agent-config/agent-config.js
import {Agent, Trigger} from '../../models/agent.js';
import {Step} from '../../models/step.js';
import {Tool} from '../../models/tool.js';
import {createLogger} from '../../scripts/logger.js';

const logger = createLogger ('agent-config.js');

export function init () {
  let agents = [];
  let currentAgent = new Agent ({
    name: '',
    description: '',
    steps: [],
    triggers: [],
  });

  const existingAgentsList = document.getElementById ('existingAgentsList');
  const agentForm = document.getElementById ('agentForm');
  const agentNameInput = document.getElementById ('agentNameInput');
  const agentDescriptionInput = document.getElementById (
    'agentDescriptionInput'
  );
  const triggersContainer = document.getElementById ('triggersContainer');
  const stepsContainer = document.getElementById ('stepsContainer');
  const addTriggerButton = document.getElementById ('addTriggerButton');
  const addStepButton = document.getElementById ('addStepButton');
  const saveAgentButton = document.getElementById ('saveAgentButton');
  const cancelEditButton = document.getElementById ('cancelEditButton');

  // Load existing agents
  loadAgents ();

  // Event listeners
  addTriggerButton.addEventListener ('click', showTriggerModal);
  addStepButton.addEventListener ('click', addStep);
  saveAgentButton.addEventListener ('click', saveAgent);
  cancelEditButton.addEventListener ('click', cancelEdit);

  async function loadAgents () {
    logger.debug ('Loading agents from storage');
    chrome.storage.local.get (['agents'], result => {
      if (result.agents) {
        logger.debug ('Agents loaded:', result.agents.length);
        agents = result.agents.map (agentData => Agent.fromJSON (agentData));
        renderAgentsList ();
      }
    });
  }

  function renderAgentsList () {
    const listContainer = document
      .getElementById ('existingAgentsList')
      .querySelector ('ul');
    listContainer.innerHTML = '';
    const template = document.getElementById ('agentListItemTemplate');

    agents.forEach (agent => {
      const listItem = template.content.cloneNode (true);
      listItem.querySelector ('.agent-name').textContent = agent.name;

      const toggleSwitch = listItem.querySelector ('.agent-toggle');
      toggleSwitch.checked = agent.isEnabled;
      toggleSwitch.addEventListener ('change', () =>
        toggleAgent (agent.id, toggleSwitch.checked)
      );

      const deleteButton = listItem.querySelector ('.agent-delete');
      deleteButton.addEventListener ('click', () =>
        showDeleteConfirmation (agent.id)
      );

      listContainer.appendChild (listItem);
    });
  }

  function showTriggerModal () {
    const modalTemplate = document.getElementById ('triggerModalTemplate');
    const modalClone = document.importNode (modalTemplate.content, true);
    document.body.appendChild (modalClone);

    const modal = document.body.lastElementChild;
    const triggerTypeSelect = modal.querySelector ('#triggerTypeSelect');
    const urlPatternGroup = modal.querySelector ('#urlPatternGroup');
    const elementTypeGroup = modal.querySelector ('#elementTypeGroup');
    const specificElementGroup = modal.querySelector ('#specificElementGroup');
    const saveTriggerButton = modal.querySelector ('#saveTriggerButton');

    triggerTypeSelect.addEventListener ('change', () => {
      urlPatternGroup.style.display = triggerTypeSelect.value === 'url'
        ? 'block'
        : 'none';
      elementTypeGroup.style.display = triggerTypeSelect.value ===
        'element_type'
        ? 'block'
        : 'none';
      specificElementGroup.style.display = triggerTypeSelect.value ===
        'specific_element'
        ? 'block'
        : 'none';
    });

    saveTriggerButton.addEventListener ('click', () => {
      const triggerType = triggerTypeSelect.value;
      let condition;
      switch (triggerType) {
        case 'url':
          condition = modal.querySelector ('#urlPatternInput').value;
          break;
        case 'element_type':
          condition = modal.querySelector ('#elementTypeSelect').value;
          break;
        case 'specific_element':
          condition = modal.querySelector ('#elementSelectorInput').value;
          break;
      }

      if (condition && condition.trim () !== '') {
        currentAgent.triggers.push (
          new Trigger ({type: triggerType, condition: condition})
        );
        updateTriggersList ();
        const bsModal = bootstrap.Modal.getInstance (modal);
        bsModal.hide ();
      } else {
        alert ('Please enter a valid condition for the trigger.');
      }
    });

    const bsModal = new bootstrap.Modal (modal);
    bsModal.show ();
  }
  function renderAgentsList () {
    const listContainer = existingAgentsList.querySelector ('ul');
    listContainer.innerHTML = '';
    const template = document.getElementById ('agentListItemTemplate');

    agents.forEach (agent => {
      const listItem = template.content.cloneNode (true);
      listItem.querySelector ('.agent-name').textContent = agent.name;

      const toggleSwitch = listItem.querySelector ('.agent-toggle');
      toggleSwitch.checked = agent.isEnabled;
      toggleSwitch.addEventListener ('change', () =>
        toggleAgent (agent.id, toggleSwitch.checked)
      );

      const deleteButton = listItem.querySelector ('.agent-delete');
      deleteButton.addEventListener ('click', () =>
        showDeleteConfirmation (agent.id)
      );

      listContainer.appendChild (listItem);
    });
  }

  function toggleAgent (agentId, isEnabled) {
    const agent = agents.find (a => a.id === agentId);
    if (agent) {
      agent.isEnabled = isEnabled;
      saveAgents ();
    }
  }

  function showDeleteConfirmation (agentId) {
    const modal = new bootstrap.Modal (
      document.getElementById ('deleteConfirmationModal')
    );
    const confirmDeleteButton = document.getElementById ('confirmDeleteButton');

    confirmDeleteButton.onclick = () => {
      deleteAgent (agentId);
      modal.hide ();
    };

    modal.show ();
  }

  function deleteAgent (agentId) {
    agents = agents.filter (a => a.id !== agentId);
    saveAgents ();
    renderAgentsList ();
  }

  function updateTriggersList () {
    const triggersList =
      triggersContainer.querySelector ('ul') || document.createElement ('ul');
    triggersList.innerHTML = '';
    currentAgent.triggers.forEach ((trigger, index) => {
      const li = document.createElement ('li');
      li.textContent = `${trigger.type}: ${trigger.condition}`;
      const removeButton = document.createElement ('button');
      removeButton.textContent = 'Remove';
      removeButton.className = 'btn btn-danger btn-sm ml-2';
      removeButton.addEventListener ('click', () => {
        currentAgent.triggers.splice (index, 1);
        updateTriggersList ();
      });
      li.appendChild (removeButton);
      triggersList.appendChild (li);
    });
    if (!triggersList.parentNode) {
      triggersContainer.appendChild (triggersList);
    }
  }

  function addStep () {
    const stepIndex = currentAgent.steps.length;
    const stepDiv = document.createElement ('div');
    stepDiv.innerHTML = `
      <h4>Step ${stepIndex + 1}</h4>
      <input type="text" class="step-name" placeholder="Step Name">
      <select class="tool-type">
        <option value="llm">LLM</option>
        <option value="web-scraper">Web Scraper</option>
      </select>
      <textarea class="step-input" placeholder="Step Input"></textarea>
      <button class="remove-step">Remove</button>
    `;
    stepsContainer.appendChild (stepDiv);

    stepDiv.querySelector ('.remove-step').addEventListener ('click', () => {
      stepsContainer.removeChild (stepDiv);
      currentAgent.steps.splice (stepIndex, 1);
    });
  }

  async function saveAgent () {
    currentAgent.name = agentNameInput.value;
    currentAgent.description = agentDescriptionInput.value;
    currentAgent.steps = Array.from (
      stepsContainer.children
    ).map ((stepDiv, index) => {
      return new Step ({
        id: `step_${index}`,
        name: stepDiv.querySelector ('.step-name').value,
        description: `Step ${index + 1}`,
        tool: new Tool ({
          id: `tool_${index}`,
          name: stepDiv.querySelector ('.tool-type').value,
          type: stepDiv.querySelector ('.tool-type').value,
          config: {}, // This should be expanded based on the tool type
        }),
        input: stepDiv.querySelector ('.step-input').value,
        output: {key: `output_${index}`},
      });
    });
    currentAgent.triggers = currentAgent.triggers;

    try {
      // If you're saving to local storage:
      agents.push (currentAgent);
      saveAgents ();
      console.log ('Agent saved successfully:', currentAgent);
      loadAgents (); // Refresh the list of agents
      clearForm ();
      // Optionally, update UI to show success message
    } catch (error) {
      console.error ('Failed to save agent:', error);
      // Update UI to show error message
    }
  }

  // Save agents to local storage
  function saveAgents () {
    chrome.storage.local.set ({agents: agents.map (a => a.toJSON ())}, () => {
      if (chrome.runtime.lastError) {
        logger.error ('Error saving agents:', chrome.runtime.lastError);
      } else {
        logger.debug ('Agents saved successfully');
      }
    });
  }

  function cancelEdit () {
    clearForm ();
  }

  function clearForm () {
    currentAgent = new Agent ({
      name: '',
      description: '',
      steps: [],
      triggers: [],
    });
    agentNameInput.value = '';
    agentDescriptionInput.value = '';
    triggersContainer.innerHTML = '';
    stepsContainer.innerHTML = '';
  }
}
