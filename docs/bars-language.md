[JavaScript Interface](js-interface.md) | [Bars Language](bars-language.md)

# Bars Language

## Table of Contents
* [Bars Expression](#bars-expression)
    * [Literals](#literals)
    * [Insert Value](#insert-value)
    * [Block Property](#block-property)
    * [Operators](#operators)
    * [Transform](#transform)
    * [Expression](#expression)
    * [Assignments](#assignments)
* [Bars Markup](#bars-markup)
    * [Comment](#comment)
    * [Inserts](#inserts)
    * [Blocks](#blocks)
        * [If](#if)
        * [With](#with)
        * [Each](#each)
    * [Partials](#partials)
        * [Implicit](#implicit-example)
        * [Programmatic](#programmatic-example)
* [HTML Markup](#html-markup)
    * [HTML Properties](#html-properties)
    * [HTML Bindings](#html-bindings)

# Bars Expression

## Literals
numbers:
```
1
0.1
1.4e9
```

strings:
```
'this is a string.'
```

booleans:
```
true
false
```

null:
```
null
```

## Insert Value
```
<name>
<path>.<to>.<value>
```

## Block Property
```
@<property-name>
```

## Operators

Parentheses:
```
(<expression>)
```

Brackets:
```
<value>[<expression>]
```

Conditional:
```
<condition> ? <then-expression> : <else-expression>
```

Unary:
```
! <value>
```

Binary
```
<value> + <value>
<value> - <value>
<value> / <value>
<value> * <value>
<value> % <value>
<value> || <value>
<value> && <value>
<value> < <value>
<value> <= <value>
<value> > <value>
<value> >= <value>
<value> == <value>
<value> != <value>
<value> === <value>
<value> !== <value>

<value> . <value-name>
```

## Transform
```
@<transform-name>(<arg>, <arg>,...)
```

Built in transforms:
- log(arg, arg, ...)
- number(arg)
- string(arg)
- upperCase(str)
- lowerCase(str)
- reverse(arr)
- slice(arr, start, end)
- sort(arr[, prop])
- map(arr[, prop])
- sum(arr[, prop])
- ave(arr[, prop])

## Expression
```
<literal|value|transform>
<expression><operator><expression>
```

## Assignments
```
<variable> = <expression>
```

# Bars Markup

## Comment
```handlebars
{{!<comment>}}
{{!--<code-comment>--}}
```

examples:

```
{{! this is a comment }}
```

This is just a simple text/html comment.

```
{{!--

{{test}}

--}}
```

You can use this style of commenting to de-activate Bars Markup code.

## Inserts
```
{{<expression>}}
```

examples:
```
{{name}}
```
The string contents of the variable `name` will be rendered.

```
{{person.name}}
```
The string contents of the variable `person.name` will be rendered.

```
{{person['name']}}
```
The string contents of the variable `person['name']` will be rendered.

```
{{x + y}}
```
The result of the expression `x + y` will be rendered.

```
{{@lowerCase(name)}}
```
The result of transform `lowerCase` applied to the variable `name` will be rendered.


## Blocks

```
{{#<name> <args> <context-map>}}
    <content>
{{else <name> <args> <context-map>}}
    <content>
{{else}}
    <content>
{{/<name>}}
```

### if
```
{{#if <condition> [<context-map>]}}
    <content>
{{else}}
    <content>
{{/if}}
```

example:
```
{{#if x < 5}}
    x is less than 5.
{{else if x > 5}}
    x is greater than 5.
{{else}}
    x is equal to 5.
{{/if}}
```

### with
```
{{#with [<context>] [<context-map>]}}
    <content>
{{else}}
    <content>
{{/with}}
```

example: (changing context)
```
{{#with person}}
    name: {{name}}
    age: {{age}}
{{else}}
    no person data.
{{/with}}
```

example: (creating variables)
```
{{#with name=person.name age=person.age}}
    name: {{name}}
    age: {{age}}
{{else}}
    no person data.
{{/with}}
```

example: (creating variables from new context)
```
{{#with person n=name a=age}}
    name: {{n}}
    age: {{a}}
{{else}}
    no person data.
{{/with}}
```


### each
```
{{#each <object|array> [<context-map>]}}
    <content>
{{else}}
    <content>
{{/each}}
```

example:
```
{{#each songs}}
    name: {{name}}
    artist: {{artist}}
    album: {{album}}
{{else}}
    no songs
{{/each}}
```

example: (@index/@key)
```
{{#each songs}}
    track: {{@index}}
    name: {{name}}
    artist: {{artist}}
    album: {{album}}
{{else}}
    no songs
{{/each}}
```

example: (creating indexing variables)
```
{{#each songs i=@index}}
    track: {{i}}
    name: {{name}}
    artist: {{artist}}
    album: {{album}}
{{else}}
    no songs
{{/each}}
```

example: (loops in loops)
```
{{#each arrayOfArrays i=@index}}
    {{#each this ii=@index}}
        {{i}}:{{ii}}
    {{/each}}
{{/each}}
```

## Partials

Implicit:
```
{{><name> [<context>] [<context-map>]}}
```
Programmatic:
```
{{>?<name-arg> [<context>] [<context-map>]}}
```

### Implicit Example

partail.bars:
```
this is a Bars partial.
```

main.bars:
```
main page
{{>partail}}
```

The partial whose name is `partial` will be rendered.

### Programmatic Example

page1.bars:
```
this is page1.
```

page2.bars:
```
this is page2.
```

app.bars:
```
this is the app.

{{>?page}}
```

The partial whose name is stored in the variable `page` will be rendered.  As the `page` variable is changed the respective partial will be rendered.

# HTML Markup
```
<<tag-name> [<attrs>] [<props>] [<binds>]></<tag-name>>
```

example:
```
<div attr="{{attr}}" prop::{{prop}} bind:{{bind}}></div>
```

Attributes are regular HTML Attributes. `id="id"`
Properties are regular HTML Properties. `value::{{value}} => element.value = value`
Binding are JavaScript properties accessible on the JavaScript DOM element interface as a getter function `element.data('bind')`.  These properties could be very useful if a DOM element is to preform any form of manipulation to the state when triggered by an event (e.g. click).
