# Browser Assistant Chrome Extension

## Description
The Browser Assistant is a Chrome extension designed to enhance web browsing by enabling users to interact with web content through custom prompts. This extension utilizes a user-configurable API to fetch responses based on text input or web content. It's particularly useful for tasks like summarizing texts, translating content, or generating responses based on provided prompts.

## Features
- **Custom Prompts:** Users can input custom prompts that are processed to generate contextual responses.
- **Stored Prompts:** Quickly use predefined prompts such as translations, summaries, or explanations.
- **Comprehensive API Integration:** Configurable settings to connect to any supported API that accepts and returns text. Pre-configured for OpenAI's API and compatible with open-source systems like LLaMA.cpp, TabbyAPI, and VLLM.
- **Dynamic Content Interaction:** Option to include web page content as context for queries.
- **Language Selection:** Supports multiple languages for response, enhancing the flexibility of the extension.
- **Debug Mode:** For developers, the extension includes a debug mode to log detailed operational data.

## Installation
To install the Browser Assistant Chrome Extension, follow these steps:

1. **Clone the repository:**
- git clone https://github.com/yourusername/browser-assistant.git

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
Contributions to the Browser Assistant are welcome. Please ensure to follow the existing code style and include tests for any new or changed functionality.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details.

## Support
For support, please open an issue in the GitHub repository or contact the development team via email.

## About
The Browser Assistant Chrome Extension is developed and maintained by [Your Name or Organization], dedicated to improving user interaction with digital content.
