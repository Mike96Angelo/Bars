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

```handlebars
! <value>
```

#### Binary - *implemented*

```handlebars
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

```handlebars
^-?[0-9]+([.][0-9])?([Ee][+-]?[0-9]+)?$
```

### String Literal - *implemented*

```handlebars
^'[^\n']*'$
```

### Boolean Literal - *implemented*

```handlebars
true
false
```

### Insert Value - *implemented*

```handlebars
<name>
<path>/<to>/<value>
<path>.<to>.<value>
```

### Bars Insert Property - *implemented*

```handlebars
<insert-value>@<property>
```

### Bars Transfrom Function - *implemented*

```handlebars
@<trasnform>(<args>, <arg>, ...)
```
