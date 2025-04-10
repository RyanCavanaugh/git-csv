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

## reachability-is-syntactic

> Reachability analysis is based on syntax, not types, so code that appears unreachable due to type effects (including function exit points) is still considered reachable

Let's say you write some code like this
```ts
function foo(sn: string | number): boolean {
    if (typeof sn === 'string') return true;
    if (typeof sn === 'number') return false;
    
    /* this implicit return is unreachable */
}
```
TypeScript considers this an error because there is no final `return` statement in this function with a `: boolean` return type annotation.
This is because reachability analysis is (almost) always syntactic, but this code only appears to be exhaustive through type analysis.
Even though after the second `if`, `sn` would have type `never`, TypeScript doesn't exhaustively check all in-scope variables to see if one of them has become `never` in hypothetical places where they might be referenced.

There's one exception to this rule, `switch` statements, which will be analyzed to see if they are exhaustive. The function could instead be written as
```ts
function foo(sn: string | number): boolean {
    switch (typeof sn) {
        case 'string': return true;
        case 'number': return false;
    }
    // Nothing else needed
}
```
A alternative approach is to convert the final `if` to an assertion
```ts
function foo(sn: string | number): boolean {
    if (typeof sn === 'string') return true;
	Debug.assert(typeof sn === 'number');
    return false;
}
```
This has the added benefits of allowing you to reach 100% code coverage, and fails with an explicit error at runtime instead of returning `undefined` and causing a confusing downstream exception or data corruption in the case where an illegal argument gets passed for some reason.

See also #21985

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

See also #26914 for more on this.

## separate-utterances-uncorrelated

> TypeScript cannot make determinations about type compatibility based on observing that two uses of the same variable must (or should) have the exact same value

This is a sort of fundamental limitation in how control flow narrowing works. Control flow can track the determinations we've made in the *type* of a *value* when it inhabits a variable or property:
```ts
function foo(sn: string | number) {
    // Not safe, sn might be anumber
    console.log(sn.toLowerCase());

    if (typeof sn === "string") {
        // In this block, we know sn is a string
        console.log(sn.toLowerCase());
    }
}
```

However, control flow *can't* narrow the "type of a type", as might happen in a type parameter:
```ts
function foo<T extends string | number>(arg1: T, arg2: T) {
    if (typeof arg1 === "string") {
        // No determinations about `T` are in effect here
        console.log(arg2.toLowerCase());
    }
}
```
This is generally a good thing since these determinations aren't sound anyway:
```ts
// This legal call would cause a crash because 42.toLowerCase does not exist
foo<string | number>("hello", 42);
```

This limitation also extends to two utterances of the same identifier. Let's say we wrote something like this:
```ts
interface MyStruct {
    x: string;
    y: number;
}

function copy<K extends keyof MyStruct>(src: MyStruct, dst: MyStruct, key: K) {
    dst[key] = src[key];
}
```
This is obviously legal by construction, but TS doesn't have any logic to detect that both sides of the assignment ultimately must resolve to the same place. From TS's perspective, this function looks identical to a slightly different one:
```ts
interface MyStruct {
    x: string;
    y: number;
}

function copy<K extends keyof MyStruct>(src: MyStruct, dst: MyStruct, srcKey: K, dstKey: K) {
    dst[dstKey] = src[srcKey];
}
// This legal call would corrupt someOtherStruct (bad)
copy<"x" | "y">(someStruct, someOtherStruct, "x", "y");
```
You can construct other programs that appear safe if you *iterate* through all possible values a variable could have; in general TypeScript doesn't and won't perform that kind of analysis because it's combinatorially explosive to do so.

See also
 * #33014 which proposes allowing certain sound constrained forms of "type narrowing"
 * #33912 which is a similar proposal
 * #27808 which proposes the ability to write a generic function that can't accept union type arguments

## no-runtime-features

> It is contrary to TypeScript's design goals to add new runtime syntax, i.e. features that transpile or downlevel into new JS code. All suggestions proposing this are automatically rejected.

We do not accept suggestions for new runtime features.

## no-type-system-effects

> TypeScript type system and its type system don't change the behavior of JavaScript. If code works a certain way in regular JS, TS doesn't change that.

TODO: Write me.

