const { validate } = require('./dist/index.js');

(async () => {
    const data = {
        model: "gemini-3-flash",
        messages: [
            {
                role: "user",
                content: "Xin chào"
            }
        ],
        toolChoice: []
    };

    const rules = {
        model: 'required|string',
        messages: 'required|array|min:1',
        'messages.*.role': 'required|string',
        'messages.*.content': 'required|string',
        maxTokens: 'required|number',
    };

    const result = await validate(data, rules);
    console.log('Valid:', result.valid);
    console.log('Errors:', JSON.stringify(result.errors, null, 2));
    console.log('Data:', JSON.stringify(result.data, null, 2));
})();
