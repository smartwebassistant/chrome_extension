document.addEventListener('DOMContentLoaded', () => {
    const statusDisplay = document.getElementById('status');
    const summaryTextArea = document.getElementById('textArea');
    const startAnalyzeButton = document.getElementById('startAnalyzeButton');
    const startProcessButton = document.getElementById('startProcessButton');

    //url of text_generation API
    //const gpu_url = 'http://gpu:5000/v1/completions'; //text-generation-webui
    const gpu_url = 'http://gpu:11434/api/generate';   //ollama
    //const gpu_url = 'http://gpu:3002/completions'; //llama.cpp
    // const gpu_url = 'http://gpu:3003/v1/completions';
    //url of vllm API
    //const gpu_url = 'http://gpu:8088/v1/completions';

    const global_api_service = 'ollama'
    //const global_api_service = 'llama.cpp'
    //const global_llm_model = '/data/dev/models/Starling-LM-7B-alpha'
    //const global_llm_model = 'starling-lm'
   // const global_llm_model = 'hermes'

   const global_llm_model = 'qwen:32b-chat-v1.5-q4_0'
    
    const maxtokens = 4096
    
    function updateStatus(message) {
        statusDisplay.textContent = message;
    }

    function getContent(data) {
        if (global_api_service === 'llama.cpp') {
            return data.content.trim()
        } else if (global_api_service === 'ollama') {
            return data.response.trim()
        } else {
            return data.choices[0].text.trim()
        }
    }

    function fetchOpenAI(apiPayload) {
        if (global_api_service === 'vllm' || global_api_service === 'ollama' ) {
            apiPayload['model'] = global_llm_model
        }

        if (global_llm_model.startsWith('qwen') || global_llm_model === 'yi' || global_llm_model === 'hermes') {
            const pre_prompt = '<|im_start|>system<|im_end|><|im_start|>user: '
            const post_prompt = '<|im_end|><|im_start|>assistant: '
            apiPayload.prompt = pre_prompt + apiPayload.prompt + post_prompt
        }

        if (global_llm_model === 'mistral' || global_llm_model === 'starling-lm' || global_llm_model === '/data/dev/models/Starling-LM-7B-alpha') {
            const pre_prompt = 'GPT4 Correct User: '
            const post_prompt = '<|end_of_turn|>GPT4 Correct Assistant:'
            apiPayload.prompt = pre_prompt + apiPayload.prompt + post_prompt
        }

        if (global_llm_model === 'capybara') {
            const pre_prompt = 'USER:'
            const post_prompt = ' ASSISTANT:'
            apiPayload.prompt = pre_prompt + apiPayload.prompt + post_prompt
        }

        if (global_llm_model === 'openbuddy') {
            const pre_prompt = 'User:'
            const post_prompt = ' Assistant:'
            apiPayload.prompt = pre_prompt + apiPayload.prompt + post_prompt
        }

        if (global_llm_model === 'phi2') {
            const pre_prompt = 'Instruct: '
            const post_prompt = '\nOutput:'
            apiPayload.prompt = pre_prompt + apiPayload.prompt + post_prompt
        }

        summaryTextArea.value = JSON.stringify(apiPayload)

        return fetch(gpu_url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(apiPayload)
        }).then(response => response.json());
    }

    function handleResponseError(operation) {
        updateStatus(`Please refresh the webpage.`);
        console.error(`${operation} Error:`, chrome.runtime.lastError?.message);
    }

    function extractWebpageText(tabId, processFunction) {
        updateStatus('Extracting text from the webpage...');
        chrome.tabs.sendMessage(tabId, {action: "getText"}, function(response) {
            if (chrome.runtime.lastError || !response) {
                handleResponseError('Extraction');
                return;
            }
            processFunction(response.text);
        });
    }

    startProcessButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].id) extractWebpageText(tabs[0].id, summarizeText);
        });
    });

    startAnalyzeButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].id) extractWebpageText(tabs[0].id, extractContent);
        });
    });

    // function extractAndAnalyzeContent(text) {
    //     extractContent(text, translateText);
    // }

    function extractContent(text) {
        updateStatus('Filtering content...');
        const payload = {
            prompt: "Here is the full text from a webpage. Please extract and provide only the main news content, keep the original content, do not summarize it, removing all advertisements, external links, navigational elements, and any unrelated content: " + text,
            max_tokens: maxtokens, 
            temperature: '0.7', 
            top_p: 0.9
        };
        fetchOpenAI(payload)
            .then(data => {
                const content = getContent(data);
                summaryTextArea.value = content;
                //callback(content);
            })
            .catch(error => {
                updateStatus('Failed to filter content.' + error);
                //console.error('Error:', error);
            });
    }

    function summarizeText(text) {
        updateStatus('Summarizing text...' + text.length);
        const payload = {
            prompt: "Please summarize the main points of the following news article and provide an analysis of the author's perspective or intended message. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text, 
            max_tokens: maxtokens, 
            temperature: 0.7, 
            top_p: 0.9
        };
        fetchOpenAI(payload)
            .then(data => translateText(getContent(data)))
            .catch(error => {
                updateStatus('Failed to summarize text.' + error);
                //console.error('Error:', error);
            });
    }

    function translateText(text) {
        updateStatus('Translating text into Chinese...');
        const payload = {
            prompt: 'Please translate the following text into Chinese: ' + text, 
            max_tokens: maxtokens, 
            temperature: 0.7, 
            top_p: 0.9
        };
        fetchOpenAI(payload)
            .then(data => {
                summaryTextArea.value = getContent(data);
                updateStatus('Translation complete.');
            })
            .catch(error => {
                updateStatus('Failed to translate summary.' + error);
                //console.error('Translation Error:', error);
            });
    }
});
