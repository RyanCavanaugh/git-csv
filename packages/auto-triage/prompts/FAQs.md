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

---

See also [this Stackoverflow post](https://stackoverflow.com/a/41750391/)

## void-not-undefined

> `void` and `undefined` mean the same thing, so should act identically

`void` is not an alias for `undefined`. They are different types for different situations, and they fact that they behave differently is therefore intentional.

---

See also [this StackOverflow post](https://stackoverflow.com/questions/58885485/why-does-typescript-have-both-void-and-undefined/58885486#58885486)

## no-callback-cfa

> Control flow analysis doesn't incorporate indirect effects of function calls

Mutations, e.g. changes to local variables, aren't tracked across function calls. For example, if you write code like this
```ts
function foo() {
    let m: string | number = "hello world!";

    mutateM();

    if (m === 42) {
        // TypeScript thinks this is impossible because
        // the change to 'm' in 'mutateM' is not analyzed
        // as a result of the call to mutateM (direct or indirect)
    }

    function mutateM() {
        m = 42;
    }
}
```

---

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

---

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

---

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

---

See also
 * #33014 which proposes allowing certain sound constrained forms of "type narrowing"
 * #33912 which is a similar proposal
 * #27808 which proposes the ability to write a generic function that can't accept union type arguments

## no-runtime-features

> It is contrary to TypeScript's design goals to add new runtime syntax, i.e. features that transpile or downlevel into new JS code. All suggestions proposing this are automatically rejected.

We do not accept suggestions for new runtime features. "Runtime" means anything that isn't strictly erasable syntax. All new syntax added to TypeScript must be only in the type domain; anything that would generate new JavaScript code, or require new libaries to be present, is not considered an in-scope suggestion for TypeScript.

Prior runtime additions like `enum`, class constructor properties, and `namespace` statement blocks are examples of prior TypeScript features that violate this rule and would not be added today.

This rule is strictly enforced.

## async-function-promise-return-type

> Why do I have to write `async function foo(): Promise<string>` instead of just `async function foo(): string` ? The `Promise<>` part should be inferred

While the idea of wrapping return type annotations in `Promise<>` is appealing in simple cases, this would create very confusing inconsistencies when thinking about more complex cases.

Let's say you write some types with these intended semantics:
```ts
// Functions can either synchronously return a string,
// or asynchronously return a number
type SomeReturn = string | Promise<number>;
type SomeFunc = () => SomeReturn;
function callSomeFunc(func: SomeFunc) {
    // ...
}
```

In another part of your code, you consume this in a sync function:
```ts
function myFunc(): SomeReturn {
    return "hello world"; // OK
    // return 42; <- invalid
}
// OK, myFunc is a legal () => SomeReturn
callSomeFunc(myFunc);
```
So far so good.

Elsewhere, let's use this type in an async context:
```ts
async function myAsyncFunc(): SomeReturn {
    return "hello world";
}
```
At this point, we are faced with a question as to what wrapping here means. The definition of `SomeReturn` we wrote above says that this function should have a type error (this function must `return` a `number` which will become a `Promise<number>` in the caller).

The "you should obviously just wrap this, stop making things so difficult" interpretation is that this function means:
```ts
async function myAsyncFunc(): Promise<SomeReturn> {
```

Under this interpretation, we have a problem, because the function is accepted as valid, but can't be used as a `() => SomeReturn`:
```ts
// Illegal, myAsyncFunction can return a Promise<string>, but
// that's not a legal return for a SomeFunc
callSomeFunc(myAsyncFunction);
```
This is now extremely confusing. You wrote a function with an explicit `SomeReturn` return type, but can't use it where a `SomeReturn`-returning function is required!

You can imagine a dozen different rules to try to patch this up, but all of them create varying inconsistencies where you can't reliably predict what the return type annotation of an `async` function *means* without some deeper reasoning, and most of them create even worse problems.

FOr example, let's say we had the ad hoc rule "Only wrap with `Promise<>` if `Promise` isn't already in the return type", e.g. you can write
```ts
async function foo(): string | Promise<number> {
    return 42; // <- valid
    // return "hello"; <- not valid
}
```
Then let's change `foo` to be generic:
```ts
async function foo<T>(x: T): T {
    return x;
}
```

and call it
```ts
function indirect(x: string | Promise<number>) {
    const p = foo(x);
}
```
At this point, we have two interpretations available as to what meaning `foo` has here:
```ts
// Option 1: `T` got wrapped with Promise "earlier" in the process `foo` is:
async function foo(x: string | Promise<number>): Promise<string | Promise<number>>
```
*or*
```ts
// Option 2: generic instantiation acts like textual replacement, so `foo` is:
async function foo(x: string | Promise<number>): string | Promise<number>
```

Option 1 is confusing because, in virtually all other ways, generic instantiation *does* work like a lexical replacement of the type parameter with the type arguments. Making a special carve-out here that you have to remember is inconsistent and surprising.

Option 2 is bad because it's wrong: `foo()` *can* return a `Promise<string>`.

So overall while it be a little inconvenient to write `Promise<>` around return types in `async` functions, doing so is actually very important in terms of creating consistency and predictability in the language.

## no-type-system-effects

> TypeScript type system and its type system don't change the behavior of JavaScript. If code works a certain way in regular JS, TS doesn't change that.

TODO: Write me.

---

## distributive-conditionals

> Some conditional types are distributive, which means that `never` as an input will always yield `never` as an output, and union inputs will generally produce union outputs

When conditional types act on a generic type, they become distributive when given a union type. For example, take the following:

```ts
type ToArray<Type> = Type extends any ? Type[] : never;
```

If we plug a union type into ToArray, then the conditional type will be applied to each member of that union.
```ts
type ToArray<Type> = Type extends any ? Type[] : never;
 
type StrArrOrNumArr = ToArray<string | number>;
           
type StrArrOrNumArr = string[] | number[]
```

What happens here is that ToArray distributes on:
```
  string | number;
```
and maps over each member type of the union, to what is effectively:
```
  ToArray<string> | ToArray<number>;
```
which leaves us with:

```
  string[] | number[];
```

Typically, distributivity is the desired behavior. To avoid that behavior, you can surround each side of the extends keyword with square brackets.

```ts

type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never;
 
// 'ArrOfStrOrNum' is no longer a union.
type ArrOfStrOrNum = ToArrayNonDist<string | number>;
          
type ArrOfStrOrNum = (string | number)[];
```

Note that `never` is effectively the empty union, and accordingly distributes to `never`:
```ts
type IsString<T> = T extends string ? "yes" : "no";

type S = IsString<string>;
// "yes"

type SB = IsString<string | boolean>;
// "yes" | "no"

type N = IsString<never>
// never
```

---
See also [the TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)