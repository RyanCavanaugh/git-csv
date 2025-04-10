## there-are-no-warnings

> TypeScript issues an error here but should actually issue a warning instead of an error

## spec-is-not-good

> TypeScript issues an error on this code, but it's legal according to the javascript specification, so it should not be an error

The ECMAScript spec defines the behavior of JavaScript runtime semantics. This means that even clearly buggy code, e.g.:

```ts
const output = "hello, world".substr("world");
```
has a defined behavior.

The purpose of TypeScript isn't to tell you when you've somehow managed to reach outside the bounds of the ES Spec (a nearly impossible feat), nor to only tell you when you've done something that will raise a runtime exception (something that most people agree doesn't happen nearly often enough in JS). TypeScript defines a normative set of behaviors that we think are generally "good" JS - fewer (but not necessarily zero) implicit coercions, fewer property accesses that result in undefined, fewer exceptions, fewer NaNs, and so on. This does mean that some behavior is on the borderline of "good" vs "not so good", and there are judgement calls involved when it comes to what TypeScript thinks is OK or not.

See also [this Stackoverflow post](https://stackoverflow.com/a/41750391/)

## void-not-undefined

> `void` and `undefined` mean the same thing, so should act identically

`void` is not an alias for `undefined`. They are different types for different situations, and they fact that they behave differently is therefore intentional. See [this StackOverflow post](https://stackoverflow.com/questions/58885485/why-does-typescript-have-both-void-and-undefined/58885486#58885486)

## no-callback-cfa

> Control flow analysis doesn't incorporate indirect effects of function calls

See the canonical issue #9998 for more on this.

## no-cfa-in-unreachable-code

> Control flow analysis is unable the effects of narrowing in unreachable code

TypeScript doesn't have any mechanism to perform control flow analysis or type narrowing in unreachable code, and while this might seem like a bug, it’s actually a long-standing design challenge without a clear solution. For example, consider this code:

```ts
function foo(x: number | string) {
  if (typeof x === "number") return;
  console.log(x.toLowerCase());
}
```

This works as expected because the only way to reach the `console.log` is after checking that `x` isn’t a number—so TypeScript knows it must be a string. But if the code is made unreachable, say by an unconditional `return`, TypeScript doesn't perform any narrowing in that unreachable block. It’s unclear what the starting point for analysis should be in a path that never executes. If you try to preserve earlier narrowing or ignore exits like `return`, you break other use cases, like exhaustiveness checks in switches:

```ts
function foo(x: number | string) {
  switch (typeof x) {
    case "number": break;
    case "string": break;
    default:
      x satisfies never; // OK today
  }
}
```

If we changed the control flow model to treat all exit points as non-final (so narrowing "survives" them), this `default` case would incorrectly think `x` could still be `number | string`. And if we just treat unreachable code as `any`, then tools like rename and refactor stop working reliably inside those blocks. So the current behavior is the least-broken option available. It's tagged as a bug mostly because it's confusing, not because there's a safe, correct fix ready to go.

See the canonical issue #26914 for more on this.

## separate-utterances-uncorrelated

> TypeScript cannot make determinations about type compatibility based on observing that two uses of the same variable must (or should) have the exact same value

Means what it says, I can't elaborate more right now

## no-runtime-features

> It is contrary to TypeScript's design goals to add new runtime syntax, i.e. features that transpile or downlevel into new JS code. All suggestions proposing this are automatically rejected.

We do not accept suggestions for new runtime features.

## no-type-system-effects

> TypeScript type system and its type system don't change the behavior of JavaScript. If code works a certain way in regular JS, TS doesn't change that.

TODO: Write me.

