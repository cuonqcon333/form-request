const { validate } = require('./dist/index.js');

(async () => {
    console.log('=== Testing All Validation Rules ===\n');

    // Test 1: URL validation
    console.log('1. URL Validation:');
    let result = await validate(
        { website: 'https://example.com' },
        { website: 'required|url' }
    );
    console.log('Valid URL:', result.valid ? '✓' : '✗');

    // Test 2: Date validation
    console.log('\n2. Date Validation:');
    result = await validate(
        { birthday: '2000-01-01' },
        { birthday: 'required|date' }
    );
    console.log('Valid Date:', result.valid ? '✓' : '✗');

    // Test 3: Regex validation
    console.log('\n3. Regex Validation (phone):');
    result = await validate(
        { phone: '0123456789' },
        { phone: 'required|regex:^\\d{10}$' }
    );
    console.log('Valid Phone:', result.valid ? '✓' : '✗');

    // Test 4: Digits validation
    console.log('\n4. Digits Validation (PIN):');
    result = await validate(
        { pin: '1234' },
        { pin: 'required|digits:4' }
    );
    console.log('Valid 4-digit PIN:', result.valid ? '✓' : '✗');

    // Test 5: Digits between
    console.log('\n5. Digits Between (OTP):');
    result = await validate(
        { otp: '123456' },
        { otp: 'required|digits_between:4,8' }
    );
    console.log('Valid OTP (4-8 digits):', result.valid ? '✓' : '✗');

    // Test 6: Alpha numeric
    console.log('\n6. Alpha Numeric (username):');
    result = await validate(
        { username: 'user123' },
        { username: 'required|alpha_num' }
    );
    console.log('Valid Username:', result.valid ? '✓' : '✗');

    // Test 7: Required unless
    console.log('\n7. Required Unless:');
    result = await validate(
        { role: 'admin', reason: '' },
        { reason: 'required_unless:role,admin' }
    );
    console.log('Reason not required when role=admin:', result.valid ? '✓' : '✗');

    // Test 8: Required with
    console.log('\n8. Required With:');
    result = await validate(
        { email: 'test@example.com', email_confirmation: 'test@example.com' },
        { email_confirmation: 'required_with:email' }
    );
    console.log('Confirmation required with email:', result.valid ? '✓' : '✗');

    // Test 9: Required without
    console.log('\n9. Required Without:');
    result = await validate(
        { phone: '0123456789' },
        { phone: 'required_without:email' }
    );
    console.log('Phone required without email:', result.valid ? '✓' : '✗');

    // Test 10: Bail (stop on first error)
    console.log('\n10. Bail (stop on first error):');
    result = await validate(
        { age: 'invalid' },
        { age: 'bail|required|integer|min:18' }
    );
    console.log('Errors count (should be 1):', result.errors.length);
    console.log('First error:', result.errors[0]?.message);

    // Test 11: Complex nested wildcard with multiple rules
    console.log('\n11. Complex Nested Wildcard:');
    result = await validate(
        {
            users: [
                { name: 'John', email: 'john@example.com', website: 'https://john.com' },
                { name: 'Jane', email: 'jane@example.com', website: 'https://jane.com' }
            ]
        },
        {
            'users': 'required|array|min:1',
            'users.*.name': 'required|string|alpha_num',
            'users.*.email': 'required|email',
            'users.*.website': 'required|url'
        }
    );
    console.log('Valid nested array:', result.valid ? '✓' : '✗');
    console.log('Validated data:', JSON.stringify(result.data, null, 2));

    console.log('\n=== All Tests Complete ===');
})();
