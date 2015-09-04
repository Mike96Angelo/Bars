# Pre-release v0.1.6

## Table of Contents

* [Bars](#bars)
    * [Bars.compile(template)](#compile)
    * [Bars.registerPartial(name, template)](#register-partial)
    * [Bars.registerHelper(name, func)](#register-helper)
    * [Class: Fragment](#class-fragment)
        * [Fragment.render([data])](#frament-render)
    * [Class: DomFrag](#class-dom-frag)
        * [DomFrag.update(data)](#dom-update)
        * [DomFrag.appendTo(element)](#dom-append-to)

<a name="bars"></a>

# Bars

Client-side html templating system that emits DOM.  The templates can be updated with new data without re-writing the DOM.

### Install:
```
$ npm install bars
```

<a name="compile"></a>
## Bars.compile(template)

* *template* `String` A Bars template string.
* *return*: `Fragment` A new [Fragment](#class-fragment) created from the `template`.

Returns a new [Fragment](#class-fragment).

Example:
```javascript
var bars = Bars.create();

var frag = bars.compile('<h1>Hello, {{name}}.</h1>');

```

<a name="register-partial"></a>
## Bars.registerPartial(name, template)

* *name* `String` The name of the partial.
* *template* `Function` The partial template.
* *return*: `Bars` *This* [Bars](#bars).

Returns *this* [Bars](#bars).

Example:
```javascript
bars.registerPartial('person', '<h2>{{name}}</h2>{{#if age}} - {{age}}{{/if}}');

/**
 * To use the `person` partial in another
 * template use this {{>person <arg>}}.
 */
```

<a name="register-helper"></a>
## Bars.registerHelper(name, func)

* *name* `String` The name of the helper.
* *func* `Function` The helper function.
* *return*: `Bars` *This* [Bars](#bars).

Returns *this* [Bars](#bars).

Example:
```javascript
bars.registerPartial('caps', function (text) {
    return text && text.toString().toUpperCase();
});

/**
 * To use the `caps` partial in another
 * template use this {{?caps <args...>}}
 * or {{{?caps <args...>}}} to render as html.
 */
```

<a name="class-fragment"></a>
## Class: Fragment

A Fragment that is compiled using the [Bars.compile(template)](#bars-compile) method.

<a name="frament-render"></a>
## Fragment.render([data])

* *template* `Object` Object context for rendering.
* *return*: `DomFrag` A new [DomFrag](#class-dom-frag).

Creates a new [DomFrag](#class-dom-frag) from the compiled template and `data`.

Example:
```javascript
var dom = frag.render({name: 'John'});
```

<a name="class-dom-frag"></a>
## Class: DomFrag

A DomFrag.

<a name="dom-update"></a>
## DomFrag.update(data)

* *data* `Object` Object context for rendering update.
* *return*: `DomFrag` *This* [DomFrag](#class-dom-frag).

Updates and renders *This* [DomFrag](#class-dom-frag).

Example:
```javascript
dom.update({name: 'Bob'});
```

<a name="dom-append-to"></a>
## DomFrag.appendTo(element)

* *element*: `Element` The DOM Element to append *This* [DomFrag](#class-dom-frag) to.
* *return*: `DomFrag` *This* [DomFrag](#class-dom-frag).

Returns *this* [DomFrag](#class-dom-frag).

Example:
```javascript
dom.appendTo(document.body);
```

## Author:
    Michaelangelo Jong
    Dallas Read

## License:
    The MIT License (MIT)

    Copyright (c) 2015 Michaelangelo Jong

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
