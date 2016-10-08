# Bars Specification v1.0.0

## Markup

### Comment - *implemented*

```handlebars
{{!<comment>}}
{{!--<code-comment>--}}
```

### Block - *implemented*

```handlebars
{{#<name> <arg> <context-map>?}}

{{else[ <name> <arg> <context-map>?]}}

{{/<name>}}
```
NOTE: *context-map not implemented*

#### Built in Block helpers:
- if `<condition>`
- with `<object>`
- each `<array | object>`

### Partial - *implemented*

```handlebars
{{><name> <arg | context-map>?}}
```
NOTE: *context-map not implemented*

### Insert - *implemented*

```handlebars
{{<arg>}}
```

## Bars Argument

### Operators - *implemented*

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

### Bars Insert Property - *implemented*

```javascript
<insert-value>@<property>
```

### Bars Transform Function - *implemented*

```javascript
@<transform>(<arg>, <arg>, ...)
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
<name>=<arg> <name>=<arg> ...
```
