BarsPartialSyntax
```handlebars
{{><partial-name> [<context>] [context-map]}}

{{?><partial-name> [<context>] [context-map]}}

// no context, no context-map
{{>name}}

// context, no context-map
{{>name data}}

// no context, context-map
{{>name something=something}}

// context, context-map
{{>name data something=something}}
```

PartialContextEvaluation
```javascript
// no context, no context-map
context.newContext(
  // this
  parentContext
)

// context, no context-map
context.newContext(
  // this
  parentContext.data
)

// no context, context-map
context.newContext(
  // this
  parentContext
).map({
  something: parentContext.something
})

// context, context-map
context.newContext(
  // this
  parentContext.data
).map({
  something: parentContext.something
})
```

StateObject
```javascript
{
  data: {[data]},
  something: 'something'
}
```

BarsPartialRenderScope
```javascript
// no context, no context-map
this      -> parentContext

// context, no context-map
this      -> parentContext.data

// no context, context-map
this      -> parentContext
something -> parentContext.something

// context, context-map
this      -> parentContext.data
something -> parentContext.something
```
