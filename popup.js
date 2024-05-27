document.addEventListener('DOMContentLoaded', () => {
    const statusDisplay = document.getElementById('status');
    const summaryTextArea = document.getElementById('textArea');
    const startAnalyzeButton = document.getElementById('startAnalyzeButton');
    const startProcessButton = document.getElementById('startProcessButton');

    //url of text_generation API
    const gpu_url = 'http://gpu:5000/v1/chat/completions'; //text-generation-webui
   //const gpu_url = 'http://gpu:11434/v1/chat/completions';   //ollama
   //const gpu_url = 'http://gpu:3002/v1/chat/completions'; //llama.cpp
    // const gpu_url = 'http://gpu:3003/v1/completions';
    //url of vllm API
    //const gpu_url = 'http://gpu:8088/v1/completions';

   // const global_api_service = 'text-generation-webui'
    //const global_api_service = 'ollama'
    const global_api_service = 'llama.cpp'
    //const global_llm_model = '/data/dev/models/Starling-LM-7B-alpha'
    //const global_llm_model = 'starling-lm'
   // const global_llm_model = 'hermes'

    const global_summarization_model_en = 'mistral-7b-instruct-v0.3'
   // const global_summarization_model_en = 'llama3-8b-instruct'
   const global_translation_model_cn = 'qwen1_5-7b-chat'

   const global_llm_model = 'qwen1_5-7b-chat'
    
    const global_max_tokens = 4096
    const global_temperature = 0
    const global_top_p = 0.9
    const global_mode = 'instruct'
    
    function updateStatus(message) {
        statusDisplay.textContent = message;
    }

    function getContent(data) {
        return data.choices[0].message.content.trim()
    }

    function fetchOpenAI(model,system_prompt, user_prompt, max_tokens, temperature, top_p, api_url=gpu_url) {
        payload = {
            model: model || global_llm_model,
            max_tokens: max_tokens || global_max_tokens,
            temperature: temperature || global_temperature,
            top_p: top_p || global_top_p,
        }
        messages = [
            {
                role: 'system',
                content: user_prompt
            },
            {
                role: 'user',
                content: user_prompt
            }
        ]
        payload.messages = messages

        if (global_api_service === 'text-generation-webui') {
            payload.mode = global_mode  
            payload.skip_special_tokens = false
            payload.custom_stopping_strings = "<eot_id>"
        }

        summaryTextArea.value = JSON.stringify(payload)

        return fetch(api_url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error, status = ${response.status}`);
            }
            return response.json();
        }).catch(error => {
            console.error('Error fetching data:', error);
            updateStatus(`Error: ${error.message}`);
            throw error;  // Re-throw the error for further handling if necessary
        });
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

    startAnalyzeButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].id) extractWebpageText(tabs[0].id, extractCarInfo);
        });
    });

    startSummarizeButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].id) extractWebpageText(tabs[0].id, summarizeTextOnly);
        });
    });

    startProcessButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].id) extractWebpageText(tabs[0].id, summarizeText);
        });
    });

    function extractContent(text) {
        updateStatus('Filtering content...' + text.length);
        prompt = "Here is the full text from a webpage. Please extract and provide only the main news content, keep the original content, do not summarize it, removing all advertisements, external links, navigational elements, and any unrelated content: " + text
        fetchOpenAI(global_summarization_model_en, "", prompt, global_max_tokens, global_temperature, global_top_p)
            .then(data => {
                content = getContent(data);
                summaryTextArea.value = content;

                content = summarizeText(content);
                summaryTextArea.value = content;
                //callback(content);
            })
            .catch(error => {
                updateStatus('Failed to filter content.' + error);
                //console.error('Error:', error);
            });
    }

    function convertTranslateNews(text) {
        updateStatus('Filtering content...' + text.length);
        prompt = "Here is the full text from a webpage. Please extract and provide only the news, keep the original content no change, do not summarize it, removing all advertisements, external links, navigational elements, and any unrelated content: " + text
        fetchOpenAI(global_summarization_model_en, "", prompt, global_max_tokens, 0, global_top_p)
            .then(data => {
                content = getContent(data);
                summaryTextArea.value = content;

                content = translateText(content);
                summaryTextArea.value = content;

                content = rewriteNews(content);
                summaryTextArea.value = content;
                //callback(content);
            })
            .catch(error => {
                updateStatus('Failed to filter content.' + error);
                //console.error('Error:', error);
            });
    }

    function extractCarInfo(text) {
        updateStatus('Filtering content...' + text.length);
        prompt = "Here is the full text from a used tesla car selling webpage. Please extract car name, VIN, mileage, selling price, lowest list price, battery capacity, battery range, dealder city, whether it's one owner car, whether title is clean or savage, whether there is accident from the page and return in yaml format, whethere there is lifetime free supercharging, any other information seller provided which I should be aware: " + text
        fetchOpenAI(global_summarization_model_en, "", prompt, global_max_tokens, global_temperature, global_top_p)
            .then(data => {
                content = getContent(data);
                summaryTextArea.value = content;
            })
            .catch(error => {
                updateStatus('Failed to filter content.' + error);
                //console.error('Error:', error);
            });
    }

    function summarizeTextOnly(text) {
        updateStatus('Summarizing text...' + text.length);
        prompt = "Please summarize the main points of the following news article and provide an analysis of the author's perspective or intended message. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        //prompt = "I am new to turo which is a airbnb like platform but renting the cars.Please summarize what I can learn from the reddit posts as consumer or provider and provide categorize the post to see whether it's provider feedback, consumer feedback, postive, negative, talking about insurance, finance or others. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        //prompt = "I am going to buy a used tesla on ebay.Please summarize what's the car is and also highlight the problem i should be aware. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        //prompt = "I am going to buy a used tesla.This is transcript of youtube video about used tesla car. Please summarize it and highlight what author emphasize in the video. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        
        fetchOpenAI(global_summarization_model_en, "", prompt, global_max_tokens, global_temperature, global_top_p)
            .then(data => {
                summaryTextArea.value = getContent(data);
                updateStatus('Summarization complete.');
            })
            .catch(error => {
                updateStatus('Failed to summarize text.' + error);
                console.error('Error:', error);
            });
    }

    function summarizeText(text) {
        updateStatus('Summarizing text...' + text.length);
        prompt = "Please summarize the main points of the following news article and provide an analysis of the author's perspective or intended message. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        //prompt = "I am new to turo which is a airbnb like platform but renting the cars.Please summarize what I can learn from the reddit posts as consumer or provider and provide categorize the post to see whether it's provider feedback, consumer feedback, postive, negative, talking about insurance, finance or others. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        //prompt = "I am going to buy a used tesla on ebay.Please summarize what's the car is and also highlight the problem i should be aware. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        //prompt = "I am going to buy a used tesla.This is transcript of youtube video about used tesla car. Please summarize it and highlight what author emphasize in the video. Focus on capturing the essential details and the tone of the article, so that I can understand the key information and the author's viewpoint without needing to read the full text." + text
        
        fetchOpenAI(global_summarization_model_en, "", prompt, global_max_tokens, global_temperature, global_top_p)
            .then(data => translateText(getContent(data)))
            .catch(error => {
                updateStatus('Failed to summarize text.' + error);
                console.error('Error:', error);
            });
    }

    function translateText(text) {
        updateStatus('Translating text into Chinese...');
        prompt = 'Please translate the following text into Chinese: ' + text
        fetchOpenAI(global_translation_model_cn, "", prompt, global_max_tokens, global_temperature, global_top_p)
            .then(data => {
                summaryTextArea.value = getContent(data);
                updateStatus('Translation complete.');
            })
            .catch(error => {
                updateStatus('Failed to translate summary.' + error);
                //console.error('Translation Error:', error);
            });
    }

    function rewriteNews(text) {
        updateStatus('Rewrite news into Chinese...');
        prompt = 'Please rewrite the following news into a formal news in Chinese: ' + text
        fetchOpenAI(global_translation_model_cn, "", prompt, global_max_tokens, global_temperature, global_top_p)
            .then(data => {
                summaryTextArea.value = getContent(data);
                updateStatus('Rewrite  complete.');
            })
            .catch(error => {
                updateStatus('Failed to translate summary.' + error);
                //console.error('Translation Error:', error);
            });
    }
});
