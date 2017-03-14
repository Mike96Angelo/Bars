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

RenderTree examples
```javascript
BarsPartial:children_dynamic() ? DYNAMIC : STATIC
    name:literal(context(<name-expression>)) ? STATIC : DYNAMIC
    context:literal(context(<context>)) ? STATIC : DYNAMIC
    maps:children_dynamic() ? DYNAMIC : STATIC
        context(<key>):literal(context(<key>)) ? STATIC : DYNAMIC
    fragment:children_dynamic() ? DYNAMIC : STATIC
```
partial.bars
```handlebars
This is a static partial
```
