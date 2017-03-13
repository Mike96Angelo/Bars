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
    obj[key], // entry
    key,      // key
    obj       // object
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
entry     -> block-return[0] -> parenetContext.obj[block-func-vars['key']]
key       -> block-return[1] -> block-func-vars['key']
object    -> block-return[2] -> parentContext.obj
something -> parentContext.something
```

RenderTree examples
```javascript
BarsBlock(<name>):children_dynamic() ? DYNAMIC : STATIC
    args:children_dynamic() ? DYNAMIC : STATIC
        context(<arg>):literal(context(<arg>)) ? STATIC : DYNAMIC
    maps:children_dynamic() ? DYNAMIC : STATIC
        context(<key>):literal(context(<arg>)) ? STATIC : DYNAMIC
    consequent(<node>):children_dynamic() ? DYNAMIC : STATIC
    alternate(<node>):children_dynamic() ? DYNAMIC : STATIC
```

```handlebars
{{#if true}}
    some text
{{else}}
    some other text
{{/if}}
```

```javascript
BarsBlock(if):STATIC
    args:STATIC
        true:STATIC
    maps:STATIC
    consequent(Fragment):STATIC
        textNode:STATIC
            value => 'some text':STATIC
    alternate(Fragment):STATIC
        textNode:STATIC
            value => 'some other text':STATIC
```

```handlebars
{{#if test}}
    some text
{{else}}
    some other text
{{/if}}
```

```javascript
BarsBlock(if):DYNAMIC
    args:DYNAMIC
        conext(test):DYNAMIC
    maps:STATIC
    consequent(Fragment):STATIC
        textNode:STATIC
            value => 'some text':STATIC
    alternate(Fragment):STATIC
        textNode:STATIC
            value => 'some other text':STATIC
```

```handlebars
{{#if test something='something'}}
    some text
{{else}}
    some other text
{{/if}}
```

```javascript
BarsBlock(if):DYNAMIC
    args:DYNAMIC
        conext(test):DYNAMIC
    maps:STATIC
        context(something):STATIC
    consequent(Fragment):STATIC
        textNode:STATIC
            value => 'some text':STATIC
    alternate(Fragment):STATIC
        textNode:STATIC
            value => 'some other text':STATIC
```

```handlebars
{{#if test something=something}}
    some text
{{else}}
    some other text
{{/if}}
```

```javascript
BarsBlock(if):DYNAMIC
    args:DYNAMIC
        conext(test):DYNAMIC
    maps:DYNAMIC
        context(something):DYNAMIC
    consequent(Fragment):STATIC
        textNode:STATIC
            value => 'some text':STATIC
    alternate(Fragment):STATIC
        textNode:STATIC
            value => 'some other text':STATIC
```
