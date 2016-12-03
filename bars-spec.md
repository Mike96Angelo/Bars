# Bars Specification v1.0.0

## Markup

### Comment - *implemented*

```handlebars
{{!<comment>}}
{{!--<code-comment>--}}
```

### Block - *implemented*

```handlebars
{{#<name> <expression> <context-map>?}}

{{else[ <name> <expression> <context-map>?]}}

{{/<name>}}
```
NOTE: *context-map not implemented*

#### Built in Block helpers:
- if `<condition>`
- with `<object>`
- each `<array | object>`

### Partial - *implemented*

```handlebars
{{><name> <expression | context-map>?}}
```
NOTE: *context-map not implemented*

### Partial Router - *not implemented*

```handlebars
{{>?<name-expression> <expression | context-map>?}}
```
The result of the name-expression tell the partail router which partial to render.

NOTE: *context-map not implemented*

### Insert - *implemented*

```handlebars
{{<expression>}}
```

## Bars Expression

### Operators - *implemented*

#### parentheses
```javascript
(<expression>)
```
#### Unary - *implemented*

```javascript
! <value>
```

#### Binary - *implemented*

```javascript
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
```

### Number Literal - *implemented*

```javascript
^-?[0-9]+([.][0-9])?([Ee][+-]?[0-9]+)?$
```

### String Literal - *implemented*

```
^'[^\n']*'$
```

### Boolean Literal - *implemented*

```handlebars
true
false
```

### Null Literal - *implemented*

```handlebars
null
```

### Insert Value - *implemented*

```javascript
<name>
~?/<path>/<to>/<value>
<path>.<to>.<value>
```

### Bars Block Property - *implemented*

```javascript
@<property>
~?/<path>/<to>/@<property>
```

### Bars Transform Function - *implemented*

```javascript
@<transform>(<expression>, <expression>, ...)
```

#### Built in Transform functions:
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

## Bars Context Map

```javascript
<name>=<expression> <name>=<expression> ...
```
