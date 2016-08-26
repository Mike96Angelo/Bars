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
{{><name> <arg>}}
```

### Insert - *implemented*

```bars
{{<arg>}}
```

## Bars Argument

### Operators

#### Pre

```bars
! <value>
```

#### Post

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

### Number Literal

```bars
-?[0-9]+
```

### String Literal

```bars
'[^\n']*'
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

### Bars Transfrom Function

```bars
@<trasnform>(<args>, <arg>, ...)
```
