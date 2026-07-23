# Code Style

## Function declarations

- Use `function` declarations for all top-level functions.
- Use arrow functions only when defining a function **inside** another function.

```ts
// correct
function handleClick() { ... }

// correct — arrow inside a function
function setup() {
  const onClick = () => { ... };
}

// avoid
const handleClick = () => { ... };
```

## Function parameters

- Always receive parameters as a single object, never as separate positional params.
- Always create an interface for that object.
- Destructure the object in the function body.

```ts
// correct
interface CreateUserParams {
  name: string;
  email: string;
}

function createUser({ name, email }: CreateUserParams) { ... }

// avoid
function createUser(name: string, email: string) { ... }
```

## Event handlers

- Never use inline arrow functions for events.
- Always create a named handler function prefixed with `handle` + event name.

```tsx
// correct
function handleOnClick() { ... }
function handleOnMouseOver() { ... }

<button onClick={handleOnClick} onMouseOver={handleOnMouseOver} />

// avoid
<button onClick={() => { ... }} />
```

## Conditional statements

- Always use braces `{}` with `if` statements, never use one-liners.
- Always break to a new line.
- Prefer using `else` when possible to make the code flow clearer. Only avoid `else` if it makes the code significantly simpler (e.g., early returns).

```ts
// correct
if (condition) {
  doSomething();
} else {
  doOtherThing();
}

// acceptable with early return
if (!isValid) {
  return false;
}

// avoid
if (!/^[0-9A-Z]{12}$/.test(body)) return false;
```

## Arrow functions

- Always use explicit `return` statements in arrow functions, even in short callbacks like `filter`, `map`, etc.
- Never use implicit returns (shorthand syntax without braces).

```ts
// correct
array.filter((item) => {
  return item.id > 5;
});

array.map((user) => {
  return user.name.toUpperCase();
});

// avoid
array.filter((item) => item.id > 5);
array.map((user) => user.name.toUpperCase());
```

## Regex patterns

- Always create a named variable with a clear, descriptive name that explains what the regex validates.
- Use the variable in conditional statements instead of inline regex.

```ts
// correct
const matchAlphaNumeric = /^[0-9A-Z]{12}$/.test(body);
if (!matchAlphaNumeric) {
  return false;
}

// avoid
if (!/^[0-9A-Z]{12}$/.test(body)) {
  return false;
}
```

## HTTP requests (Axios)

- Configure the Axios instance with `validateStatus: () => true` so it never throws based on HTTP status — only real network/timeout failures should reject the promise.
- Centralize the status-code decision in one place (e.g. a single gateway/client method that every call goes through), not scattered across every call site.
- In that one place, inspect `response.status` and decide explicitly: 2xx returns the data; a status that means "expected empty result" (e.g. 404 for "not found") returns normally without throwing; any other non-2xx status throws a domain-specific error.
- Callers downstream should never see Axios or its exceptions directly — they just get data, `undefined`, or a domain error.

```ts
// correct — axios.lib.ts
export function criarAxiosInstance({
  baseURL,
  timeout,
}: CriarAxiosInstanceParams): AxiosInstance {
  return axios.create({
    baseURL,
    timeout,
    validateStatus: () => {
      return true;
    },
  });
}

// correct — single gateway method every request goes through
async function post<TResponse>({ path, body }: PostParams): Promise<TResponse> {
  let response;

  try {
    response = await http.post<TResponse>(path, body);
  } catch (error) {
    throw new ApiError({ path, cause: error as Error });
  }

  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }

  if (response.status === 404) {
    return undefined as TResponse;
  }

  throw new ApiError({ path, status: response.status, data: response.data, cause: new Error(`Request failed with status code ${response.status}`) });
}

// avoid — letting axios throw on every non-2xx and catching it ad hoc at each call site
try {
  const response = await http.post(path, body);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return undefined;
  }
  throw error;
}
```

## Variable spacing

- Add a blank line between variable declarations to improve readability and prevent code from looking cluttered.

```ts
// correct
const name = "John";

const email = "john@example.com";

const age = 30;

// avoid
const name = "John";
const email = "john@example.com";
const age = 30;
```
