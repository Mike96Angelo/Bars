# Bars

[![GitHub release](https://img.shields.io/github/release/Mike96angelo/Bars.svg?maxAge=21600)](https://github.com/Mike96Angelo/Bars/releases)
[![npm version](https://img.shields.io/npm/v/bars.svg?maxAge=21600)](https://www.npmjs.com/package/bars)
[![npm downloads](https://img.shields.io/npm/dm/bars.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=bars&from=2015-08-13)
[![npm downloads](https://img.shields.io/npm/dt/bars.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=bars&from=2015-08-13)

Bars is a lightweight high performance HTML aware templating engine.  Bars emits DOM rather than DOM-strings, this means the DOM state is preserved even if data updates happen.  Bars can also emit DOM-strings for backend templating if desired.  This way one can use Bars for both static content generation and dynamic web application views.

# Make Bars Better

Bars is still in early development, please share any suggestions and report any bugs to the [GitHub issues](https://github.com/Mike96Angelo/Bars/issues) page, so we can continue to improve Bars.  If you want to contribute to Bars, [fork Bars on GitHub](https://github.com/Mike96Angelo/Bars) and send in a pull request.  For ways to contribute check out the [issues](https://github.com/Mike96Angelo/Bars/issues) page on GitHub.

### Install:
```
$ npm install bars
```

# What Bars Looks Like

[Bars Language and Docs](docs/js-interface.md).
* [Demo App](https://mike96angelo.github.io/Bars/demo/)
* [JSFiddle](https://jsfiddle.net/ufcdxm4q/6/)

### index.bars:
```handlebars
{{#with todos=todos}}
<h2>To Do App</h2>
<input id="new-list" todos:{{todos}} placeholder="Add something to your list..." />
<ul>
{{#each todos}}
  <li class="{{del ? 'del' : ''}}">
    <div>
      <span class="list-complete {{complete ? 'done' : ''}}" todo:{{this}}></span>
      <span class="list">{{text}}</span>
      <span class="list-del" todo:{{this}} todos:{{todos}}>x</span>
    </div>
  </li>
{{else}}
  <li>
    <span>You have nothing left to do.</span>
  </li>
{{/each}}
</ul>
{{/with}}
```
### app.js:
```javascript
var App = require('bars/app');

var app = new App(
    // options
    {
        index: require('./index.bars'),
        // partials: {},
        // transforms: {}
    },

    // State
    {
        todos: [
            {
                text: 'Buy eggs'
            }
        ]
    }
);

app.view.on('click', '.list-complete', function (evt, target){
    var todo = target.data('todo');
    todo.complete = !todo.complete;
    app.render();
});

app.view.on('click', '.list-del', function (evt, target){
    var todo = target.data('todo');
    var todos = target.data('todos');

    todo.del = true;
    app.render();

    setTimeout(function () {
        todos.splice(todos.indexOf(todo), 1);

        app.render();
    }, 200);
});

app.view.on('change', '#new-list', function (evt, target){
    var todos = target.data('todos');

    var todo = {
        del: true,
        text: target.value
    };

    todos.unshift(todo);
    app.render();
    target.value = '';

    setTimeout(function () {
        delete todo.del;
        app.render();
    }, 0);
});

app.appendTo(document.body);
```
