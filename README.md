# Bars

[![GitHub release](https://img.shields.io/github/release/Mike96angelo/Bars.svg?maxAge=21600)](https://github.com/Mike96Angelo/Bars/releases)
[![npm version](https://img.shields.io/npm/v/bars.svg?maxAge=21600)](https://www.npmjs.com/package/bars)
[![npm downloads](https://img.shields.io/npm/dm/bars.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=bars&from=2015-08-13)
[![npm downloads](https://img.shields.io/npm/dt/bars.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=bars&from=2015-08-13)

Bars is a lightweight high performance HTML aware templating engine.  Bars emits DOM rather than DOM-strings, this means the DOM state is preserved even if data updates happen.

# Make Bars Better

Bars is still in early development, please share any suggestions and report any bugs to the [GitHub issues](https://github.com/Mike96Angelo/Bars/issues) page, so we can continue to improve Bars.  If you want to contribute to Bars, [fork Bars on GitHub](https://github.com/Mike96Angelo/Bars) and send in a pull request.  For ways to contribute check out the [issues](https://github.com/Mike96Angelo/Bars/issues) page on GitHub.

### Install:
```
$ npm install bars
```

# What Bars Looks Like

### Bars:
```handlebars
<ul>
{{#each persons}}
   <li>{{@index + 1}} - {{name}}</li>
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

[Bars Language and Docs](docs/js-api.md).
* [Try Bars](https://jsfiddle.net/bba4kk3d/5/).
* [Benchmark](http://jsfiddle.net/yE9Z9/97/)
