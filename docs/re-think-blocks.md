BarsBlockSyntax
```handlebars
{{#<block> [<args>] [as |<block-return>|] [<context-map>]}}

{{#each arr as | item index array | something=something}}

{{#each obj as | entry key object | something=something}}
```

BlockContextEvaluation
```javascript
// eachBlock(Array)
context.newContext(
  // this
  arr[index], 
  // block-props
  {
    '@index':  Number(index),
    '@length': Number(arr.length),
  },
  // block-return
  [
    arr[index], // item
    index,      // index
    arr         // array
  ]
)


// eachBlock(Object)
context.newContext(
  // this
  obj[key], 
  // block-props
  {
    '@key':  String(key)
  },
  // block-return
  [
    obj[key], // item
    key,      // index
    obj         // array
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
  ],
  obj: {
    one: 'one',
    two: 'two',
    three: 'three',
  }
}
```

BarsBlockRenderScope
```javascript
// eachBlock(Array)
this      -> parenetContext.arr[block-func-vars['index']]
item      -> block-return[0] -> parenetContext.arr[block-func-vars['index']]
index     -> block-return[1] -> block-func-vars['index']
array     -> block-return[2] -> parentContext.arr
something -> parentContext.something

// eachBlock(Object)
this      -> parenetContext.obj[block-func-vars['key']]
item      -> block-return[0] -> parenetContext.obj[block-func-vars['key']]
index     -> block-return[1] -> block-func-vars['key']
object    -> block-return[2] -> parentContext.obj
something -> parentContext.something
```

