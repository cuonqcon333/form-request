# Form Request

Laravel-inspired request validation for Express.

Simple, clean, and developer-friendly validation with automatic `422` responses and validated data extraction.

[![npm version](https://badge.fury.io/js/@caplab%2Fform-request.svg)](https://www.npmjs.com/package/@caplab/form-request)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Installation

```bash
npm install @caplab/form-request
```

---

## Quick Example

```ts
import express from "express";
import { validation } from "@caplab/form-request";

const app = express();

app.use(express.json());
app.use(validation());

app.post("/register", async (req, res) => {
	await req.validate({
		email: "required|email",
		password: "required|min:6",
	});

	const data = req.validated();

	res.json({
		success: true,
		data,
	});
});
```

---

## Why Form Request?

Validation in Express is often verbose or fragmented across middleware.

Form Request brings a Laravel-style validation experience to Express:

- Laravel-like validation syntax
- Automatic `422` JSON responses
- Clean validated data extraction
- Removes unvalidated fields automatically
- Inline validation or class-based requests
- Works with both JavaScript and TypeScript

---

## Features

- Pipe-style validation rules

```ts
'email': 'required|email|min:5'
```

- Automatic validation error responses
- `req.validated()` returns only validated fields
- Nested object validation
- Array wildcard validation
- Custom validation rules
- Custom error messages
- TypeScript support
- FormRequest classes

---

## Basic Usage

### Inline Validation

```ts
app.post("/login", async (req, res) => {
	const data = await req.validate({
		email: "required|email",
		password: "required|min:6",
	});

	res.json(data);
});
```

---

## FormRequest Classes

```ts
import { FormRequest } from "@caplab/form-request";

class RegisterRequest extends FormRequest {
	rules() {
		return {
			email: "required|email",
			password: "required|min:6",
		};
	}

	messages() {
		return {
			"email.required": "Email is required",
			"email.email": "Email must be valid",
		};
	}
}

app.post("/register", async (req, res) => {
	await req.validate(RegisterRequest);

	const data = req.validated();

	res.json(data);
});
```

---

## Validated Data Only

Extra fields are automatically removed.

Request body:

```json
{
	"email": "john@example.com",
	"password": "123456",
	"is_admin": true
}
```

Validated result:

```ts
const data = req.validated();
```

Output:

```json
{
	"email": "john@example.com",
	"password": "123456"
}
```

---

## Nested Validation

```ts
await req.validate({
	"user.email": "required|email",
	"user.name": "required",
	"users.*.email": "required|email",
});
```

---

## Custom Rules

```ts
import { extend } from "@caplab/form-request";

extend("phone", async (value) => {
	return /^\d{10}$/.test(value);
});

await req.validate({
	phone: "required|phone",
});
```

---

## Custom Messages

```ts
await req.validate(
	{
		email: "required|email",
	},
	{
		attributes: {
			email: "email address",
		},
	},
);
```

Response:

```json
{
	"message": "The email address field is required."
}
```

---

## Available Rules

| Rule         | Description                     |
| ------------ | ------------------------------- |
| `required`   | Field is required               |
| `nullable`   | Field may be null               |
| `string`     | Must be a string                |
| `number`     | Must be a number                |
| `integer`    | Must be an integer              |
| `boolean`    | Must be a boolean               |
| `array`      | Must be an array                |
| `object`     | Must be an object               |
| `email`      | Must be a valid email           |
| `min:n`      | Minimum value or length         |
| `max:n`      | Maximum value or length         |
| `same:field` | Must match another field        |
| `confirmed`  | Requires `{field}_confirmation` |

---

## Example Validation Error

```json
{
	"message": "The given data was invalid.",
	"errors": {
		"email": ["The email field is required."]
	}
}
```

---

## License

MIT
