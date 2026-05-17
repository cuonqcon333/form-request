const { validate } = require('./dist/index.js');

(async () => {
    const data = {
        model: "claude-3",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Hello"
                    },
                    {
                        type: "image",
                        source: { url: "https://example.com/image.png" }
                    }
                ]
            }
        ]
    };

    const rules = {
        model: 'required|string',
        messages: 'required|array|min:1',
        'messages.*.role': 'required|string',
        'messages.*.content': 'required|array',
        'messages.*.content.*.type': 'required|string|in:text,image,tool_call,tool_result',
        'messages.*.content.*.text': 'required_if:messages.*.content.*.type,text|string',
        'messages.*.content.*.source': 'required_if:messages.*.content.*.type,image|object',
    };

    console.log('Testing nested wildcard validation...\n');
    const result = await validate(data, rules);
    console.log('Valid:', result.valid);
    console.log('Errors:', JSON.stringify(result.errors, null, 2));
    console.log('Data:', JSON.stringify(result.data, null, 2));
})();
