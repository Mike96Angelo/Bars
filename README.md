# Bars

[![GitHub release](https://img.shields.io/github/release/Mike96angelo/Bars.svg?maxAge=21600)](https://github.com/Mike96Angelo/Bars)
[![npm version](https://img.shields.io/npm/v/bars.svg?maxAge=21600)](https://www.npmjs.com/package/bars)
[![npm downloads](https://img.shields.io/npm/dm/bars.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=bars&from=2015-08-13)
[![npm downloads](https://img.shields.io/npm/dt/bars.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=bars&from=2015-08-13)

Bars is a light weight high performance templating system.  Bars emits DOM rather than DOM-strings, this means the DOM state is preserved even if data updates happen.

| Library           |   Size    | Runtime Size | Emits       |
|:------------------|----------:|-------------:|:------------|
| mustache.min.js   |   10 KB   |      10 KB   | DOM-strings |
| **bars.min.js**   | **53 KB** |    **15 KB** | **DOM**     |
| handlebars.min.js |   73 KB   |      14 KB   | DOM-strings |
| react.min.js      |  149 KB   |       N/A    | DOM         |
| react-with-addons.min.js |  160 KB|   N/A    | DOM         |
| ember.min.js      |  419 KB   |     173 KB   | DOM         |


* [Try Bars](https://jsfiddle.net/bba4kk3d/2/).
* [Benchmark](http://jsfiddle.net/yE9Z9/92/).

### Install:
```
$ npm install bars
```

# What Bars Looks Like

### Bars:
```handlebars
<ul>
{{#each persons}}
   <li>{{@number(@index) + 1}} - {{name}}</li>
{{/each}}
</ul>

{{#if x < 5}}
   <span>x is less then 5</span>
{{else if x > 5}}
    <span>x is greater then 5</span>
{{else}}
   <span>x is equal to 5</span>
{{/if}}

{{@upperCase(title)}}
```
### Object:
```javascript
{
   persons: [
      { name: 'John' },
      { name: 'Jane' },
      { name: 'Jim' },
   ],
   x: 2,
   title: 'The Cat in the Hat'
}
```

### Output:
##### *text representation*
```handlebars
<ul>
   <li>1 - John</li>
   <li>2 - Jane</li>
   <li>3 - Jim</li>
</ul>


   x is less then 5


THE CAT IN THE HAT
```

For all features see [Bars Spec](bars-spec.md).

## Table of Contents

* [Bars](#bars)
    * [Bars.compile(template)](#compile)
    * [Bars.registerBlock(name, func)](#register-block)
    * [Bars.registerPartial(name, template)](#register-partial)
    * [Bars.registerTransform(name, func)](#register-transform)
    * [Class: Fragment](#class-fragment)
        * [Fragment.render()](#frament-render)
    * [Class: DomFrag](#class-dom-frag)
        * [DomFrag.update(data)](#dom-update)
        * [DomFrag.appendTo(element)](#dom-append-to)

<a name="bars"></a>


<a name="compile"></a>
## Bars.compile(template)

* *template* `String` A Bars template string.
* *return*: `Fragment` A new [Fragment](#class-fragment) created from the `template`.

Returns a new [Fragment](#class-fragment).

Example:
```javascript
var bars = new Bars();

var frag = bars.compile('<h1>Hello, {{name}}.</h1>');

```

<a name="register-block"></a>
## Bars.registerBlock(name, func)

* *name* `String` The name of the partial.
* *func* `Function` The partial template.
* *return*: `Bars` *This* [Bars](#bars).

Returns *this* [Bars](#bars).

Example:
```javascript
bars.registerBlock('unless', function unlessBlock(con) {
    return !con;
});

/**
 * To use the `unless` block in a template
 * use this {{#unless <arg>}} {{else}} {{/unless}}.
 */
```

<a name="register-partial"></a>
## Bars.registerPartial(name, template)

* *name* `String` The name of the partial.
* *template* `String` The partial template.
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

<a name="register-transform"></a>
## Bars.registerTransform(name, func)

* *name* `String` The name of the partial.
* *func* `Function` The partial template.
* *return*: `Bars` *This* [Bars](#bars).

Returns *this* [Bars](#bars).

Example:
```javascript
bars.registerPartial('upperCase', function upperCase(a) {
    return String(a).toUpperCase();
});

/**
 * To use the `upperCase` transform in a
 * template use this {{@upperCase(<arg>)}}.
 */
```

<a name="class-fragment"></a>
## Class: Fragment

A Fragment that is compiled using the [Bars.compile(template)](#bars-compile) method.

<a name="frament-render"></a>
## Fragment.render()

* *template* `Object` Object context for rendering.
* *return*: `DomFrag` A new [DomFrag](#class-dom-frag).

Creates a new [DomFrag](#class-dom-frag) from the compiled template and `data`.

Example:
```javascript
var dom = frag.render().update({name: 'John'});
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

    Copyright (c) 2015-2016 Michaelangelo Jong

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
