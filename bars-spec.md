# Bars Specification v1.0.0

## Markup

### Comment - *implemented*

```handlebars
{{!<comment>}}
```

### Block - *implemented*

```handlebars
{{#<name> <arg>}}

{{else}}

{{/<name>}}
```

### Partial - *implemented*

```handlebars
{{><name> <arg>?}}
```

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
```

### Number Literal - *implemented*

```javascript
^-?[0-9]+([.][0-9])?([Ee][+-]?[0-9]+)?$
```

### String Literal - *implemented*

```javascript
^'[^\n']*'$
```

### Boolean Literal - *implemented*

```handlebars
true
false
```

### Insert Value - *implemented*

```javascript
<name>
<path>/<to>/<value>
<path>.<to>.<value>
```

### Bars Insert Property - *implemented*

```javascript
<insert-value>@<property>
```

### Bars Transfrom Function - *implemented*

```javascript
@<trasnform>(<args>, <arg>, ...)
```
