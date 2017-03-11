BarsBlockSyntax
```handlebars
{{#<block> [<args>] [as |<block-return>|] [<context-map>]}}

{{#each arr as | item index array | something=something}}
```

BlockContextEvaluation
```javascript
context.newContext(
  // this
  arr[index], 
  // block-props
  {
    '@index': Number(index),
    '@key':   String(index), 
    '@length': arr.length,
  },
  // block-return
  [
    arr[index], // item
    index,      // index
    arr         // array
  ]
)
```

StateObject
```javascript
{
  something: 'something',
  arr: [
    'one',
    'two',
    'three'
  ]
}
```

BarsBlockRenderScope
```javascript
this      -> parenetContext.arr[index]
item      -> block-return[0] -> parenetContext.arr[block-func-vars['index']]
index     -> block-return[1] -> block-func-vars['index']
array     -> block-return[2] -> parentContext.arr
something -> parentContext.something
```

