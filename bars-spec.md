# Bars Specification v1.0.0

## Markup

### Comment - *implemented*

```bars
{{!<comment>}}
```

### Block - *implemented*

```bars
{{#<name> <arg>}}

{{else}}

{{/<name>}}
```

### Partial - *implemented*

```bars
{{><name> <arg>?}}
```

### Insert - *implemented*

```bars
{{<arg>}}
```

## Bars Argument

### Operators - *implemented*

#### Unary - *implemented*

```bars
! <value>
```

#### Binary - *implemented*

```bars
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

```bars
-?[0-9]+
```

### String Literal - *implemented*

```bars
'[^\n']*'
```

### Boolean Literal - *implemented*

```bars
true
false
```

### Insert Value

```bars
<name>
<path>/<to>/<value>
<path>.<to>.<value>
```

### Bars Insert Property

```bars
<insert-value>@<property>
```

### Bars Transfrom Function - *implemented*

```bars
@<trasnform>(<args>, <arg>, ...)
```
