# Smart Web Assistant Chrome Extension

## Description
The Smart Web Assistant is a Chrome extension designed to interact with web browsing by leveraging Generative AI. This extension utilizes a user-configurable API to fetch responses based on text input or web content. It's particularly useful for tasks like summarizing texts, translating content, or generating responses based on specific questions.
It can 

## Features
- **Custom Prompts:** Users can input custom prompts that are processed to generate contextual responses based on current web page user browses.
- **Stored Prompts:** Quickly use predefined prompts such as translations, summaries, or explanations.
- **Comprehensive API Integration:** Configurable settings to connect to any supported API that accepts and returns text. Pre-configured for OpenAI's API and compatible with open-source systems like LLaMA.cpp, TabbyAPI, and VLLM.
- **Dynamic Content Interaction:** Option to include web page content as context for queries.
- **Language Selection:** Supports multiple languages for response, enhancing the flexibility of the extension.
- **Debug Mode:** For developers, the extension includes a debug mode to log detailed operational data.

## Limitations
- **Ollama** Although Smart Web Assistant supports commercial API endpoints such as OpenAI, as well as open-source serving APIs like llama.cpp and TabbyAPI, it currently does not integrate with Ollama due to Ollama's security policies, which prevent Chrome extensions from accessing it directly. To circumvent this restriction, you can set up a local reverse proxy like NGINX to forward traffic to the Ollama API endpoint. This workaround allows the Smart Web Assistant to communicate with Ollama indirectly.
- **Server with Internal-Signed Certs** If the API endpoint you are accessing uses HTTPS but is signed with an internally signed certificate, the connection test might fail due to the server certificate not being recognized as trusted. To resolve this issue, open the API endpoint in your browser and manually accept the certificate. Once the certificate is accepted, subsequent connection tests should pass successfully.
- **API Endpoint** Currently, the extension is designed to work exclusively with API endpoints that are compatible with OpenAI's Chat Completions API. Please ensure that your API endpoint meets this compatibility requirement for proper functionality.
- **SidePanel** You can toggle between popup and sidepanel modes by clicking the sidepanel toggle button located in the top right corner. The sidepanel mode offers the advantage of persistently displaying content even when you switch between tabs, and it provides a larger viewing area. However, it currently lacks a direct way to revert to popup mode. To switch back, simply close the sidepanel and reopen the extension to return to the popup mode.
- **Response Language** If you are not using a commercial model like OpenAI, please ensure that your chosen model can output in the desired language. For instance, if you need outputs in Chinese, select models that are capable of processing Chinese, such as Qwen, Yi, or a Finetuned Chinese Llama model.
-- **Context Length** This extension sends the entire text of a web page to the model as a prompt. Ensure that your model has a sufficiently large context length; a minimum of 32,000 tokens is recommended. Different serving platforms handle long prompts differently: for instance, llama.cpp may truncate the prompt if it exceeds the model's context length, whereas TabbyAPI might reject it outright. For TabbyAPI, it's necessary to increase both cache_size and max_seq_len to ensure successful operation if the number of tokens in the text exceeds the window size.

## Installation
### From the Chrome Web Store
1. **Open Google Chrome** and navigate to the [Chrome Web Store](https://chrome.google.com/webstore).
2. **Search** for "Smart Web Assistant."
3. **Click 'Add to Chrome'** to install the extension.

### Manual Installation (Developer Mode)
1. **Clone the repository:**
- git clone https://github.com/smartwebassistant/chrome_extension
2. **Navigate to Chrome Extensions:**
- Open Google Chrome and go to `chrome://extensions/`
- Enable Developer Mode by toggling the switch in the upper-right corner.
3. **Load the Extension:**
- Click on "Load unpacked" and select the directory where you cloned the extension.

## Usage
Once installed, the Browser Assistant can be accessed directly from the toolbar:
- Click on the extension icon to open the popup interface. You can optionally switch to SidePanel mode by clicking the SidePanel toggle button located in the top right corner.
- Click the gear button on the top right corner to open the settings page
- **Settings** Ensure that you use the correct API URL, API Token (if required by the server), and Model Name (if specified by the server). Click the 'Test' button to run a connection test. Remember to click the 'Save' button at the bottom to save your settings, which will be stored in Chrome's local storage.
- **Settings** Customize Max Tokens, Temperature, Top P if you want to
- **Settings** You can save frequently used prompts into "Stored Prompts 1 to 5". Simply click the corresponding number button to quickly execute these prompts.
- Use the input field to type a custom prompt or select one from the stored prompts.
- Select the language you want the model to output.
- Click the button Ask Your API or click the shortcuts button if you've already saved your commonly used prompts in settings.

## Configuration
To configure API settings:
1. Click on the "Settings" button in the popup.
2. Provide the necessary API URL, Token, and other parameters.
3. Test the connection using the "Test" button next to the API URL input.
4. Save your settings to ensure all prompts use the updated configuration.

## Contributing
Contributions to the Smart Web Assistant are welcome. Please ensure to follow the existing code style and include tests for any new or changed functionality.

## License
See the [LICENSE.md](LICENSE) file for details.

## Support
For support, please open an issue in the GitHub repository or contact the development team via email.
