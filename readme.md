# Smart Web Assistant Chrome Extension

## Description
The Smart Web Assistant is a Chrome extension designed to interact with web browsing by leveraging Generative AI. This extension utilizes a user-configurable API to fetch responses based on text input or web content. It's particularly useful for tasks like summarizing texts, translating content, or generating responses based on specific questions.

## Features
- **Custom Prompts:** Users can input custom prompts that are processed to generate contextual responses based on current web page user browses.
- **Stored Prompts:** Quickly use predefined prompts such as translations, summaries, or explanations.
- **Comprehensive API Integration:** Configurable settings to connect to any supported API that accepts and returns text. Pre-configured for OpenAI's API and compatible with open-source systems like LLaMA.cpp, TabbyAPI, and VLLM.
- **Dynamic Content Interaction:** Option to include web page content as context for queries.
- **Language Selection:** Supports multiple languages for response, enhancing the flexibility of the extension.
- **Debug Mode:** For developers, the extension includes a debug mode to log detailed operational data.

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
- Click on the extension icon to open the popup interface.
- Use the input field to type a custom prompt or select one from the stored prompts.
- Customize API settings by clicking on the "Settings" button, where API URL, token, and response parameters can be adjusted.
- Responses will be displayed directly in the extension's interface.

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
