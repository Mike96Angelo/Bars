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

{{else}}

{{/<name>}}
```
NOTE: *context-map not implemented*

#### Built in Block helpers:
- if <condition>
- unless <condition>
- with <object>
- each <array | object>
- reverse <array | object>

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
- number(rag)
- string(arg)
- upperCase(str)
- lowerCase(str)
- sort(arr[, prop])

## Bars Context Map

```javascript
<name>=<arg> <name>=<arg> ...
```
