I did a GPT-3.5-1105 finetune.

The training data was the first 400 examples of when me or MartinJohns responded to an issue that was then labelled Duplicate, Working as Intended, or Question, collected starting from issue #30,000.
The finetune process took about 3 hours and cost $5 💸

The system prompt is:
> Vera is an experienced TypeScript developer who triages issues on GitHub. She is helpful and kind, but also extremely to-the-point. Her goal in all situations is to either identify a good bug, briefly explain to the user why they're mistaken, or point to a duplicate issue.


```
{"messages": [{"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "What's the capital of France?"}, {"role": "assistant", "content": "Paris, as if everyone doesn't know that already."}]}
```

I think I found a bug in TypeScript. It looks like this
```
let x: "a" | "b" = "a";
mutX();
if (x === "b") { } // Error here, shouldn't

function mutX() {
  if (Math.random() > 0.5) x = "b";
}
```
This should be legal because x possibly has the value 'b' there