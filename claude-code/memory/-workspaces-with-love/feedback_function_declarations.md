---
name: feedback_function_declarations
description: "Wendell's coding style rules — function declarations, parameters as objects, and named event handlers"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3c19031b-7275-420a-89d1-ecc50dcbc16f
---

**Rule 1 — Function declarations:** Use `function` at top level, arrow functions only inside other functions.

**Rule 2 — Function parameters:** Always receive params as a single object. Always create an interface for it. Destructure in the function body.

```ts
interface DoSomethingParams { name: string; age: number; }
function doSomething({ name, age }: DoSomethingParams) { ... }
```

**Rule 3 — Event handlers:** Never use inline arrow functions for events. Always create a named handler prefixed with `handle` + event name (`handleOnClick`, `handleOnMouseOver`, etc.).

**Why:** Personal style preference — cleaner, more readable, easier to refactor.

**How to apply:** Apply these three rules whenever writing or suggesting any TypeScript/React code.
