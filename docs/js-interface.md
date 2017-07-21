[JavaScript Interface](js-interface.md) | [Bars Language](bars-language.md)

# JavaScript Interface

## Table of Contents

* [App](#app)
    * [App.Bars](#appbars)
    * [Class: App](#class-app)
        * [app.state](#appstate)
        * [app.render()](#apprender)
        * [app.on(event, listener)](#apponevent-listener)
        * [app.appendTo(element)](#appappendtoelement)
        * [app.view](#appview)
        * [app.document](#appdocument)
        * [app.window](#appwindow)
    * [Events: render](#events-render)
    * [Events: append](#events-append)
* [Interactions](#interactions)
    * [Class: Interactions](class-interactions)
        * [interactions.on(events[, targetSelector], listener)](#interactionsonevents-targetselector-listener)
* [Bars](#bars)
    * [Class: Bars](#class-bars)
        * [bars.compile(template)](#barscompiletemplate)
        * [bars.preCompile(template)](#barsprecompiletemplate)
        * [bars.build(compiledTemplate)](#barsbuildcompiledtemplate)
        * [bars.registerBlock(name, func)](#barsregisterblockname-func)
        * [bars.registerPartial(name, builtTemplate)](#barsregisterpartialname-builttemplate)
        * [bars.registerTransform(name, func)](#barsregistertransformname-func)
* [Renderer](#renderer)
    * [Class: Renderer](#class-renderer)
        * [Renderer.text(data[, options])](#renderertextdata-options)
        * [Renderer.update(data)](#rendererupdatedata)
        * [Renderer.appendTo(element)](#rendererappendtoelement)

# App
Bars App is a simple wrapper around Bars that gives you a cleaner interface.  Bars App also gives you a nice way to bind DOM interactions/events to functionality within your app.

![Bars Render Cycle](bars-render-cycle.png)

## App.Bars
App contains an accessible reference to [Bars](#bars) for your convenience.

## Class: App
* *options* `Object` Options including: template, partials, and transforms.
* *state* `Object` An object which is the App State used to render the App View.

Example:
```javascript
var App = require('bars/app');
/*
 * use require('bars/compiled/app')
 * if your templates are already compiled.
 */

var options = {
    index: mainTemplate,
    partials: {
        name: template
    },
    transforms: {
        name: func
    }
};

var state = {};

var app = new App(options, state);
```

## app.state
App state is an object/structure from which the app view is rendered.

## app.render()
This is the method you would call to update the app view.  After you manipulate the app state you should call this method to update the view.

## app.on(event, listener)
* *event* `String` An event to listen for.
* *listener* `Function` A listener function that gets call on `event`.

Add event listeners to your app.

Example:
```javascript
app.on('render', function (state) {
    console.log('the app view has been rendered');
});

app.on('append', function (target) {
    console.log('the app view has been appended to some element', target);
});
```

## app.appendTo(element)
* *element* `Element` The target element to append the app view to.

Use this method to add the app to the page.

Example:
```javascript
app.appendTo(document.body);
```

## app.view
The `app.view` is an [interactions](#class-interactions) whose baseTarget is the rendered view from the [index template](#class-app).

Example:
```javascript
app.view.on('click', '.something', function (evt, target) {
    // access data bound to the target
    // <div class="something" someData:{{someData}}>
    var someData = target.data('someData');

    // if you manipulate app.state in anyway you should then call
    // app.render();
})
```
## app.document
The `app.document` is an [interactions](#class-interactions) whose baseTarget is `document`.

Example:
```javascript
app.document.on('ready', function (evt, target) {
    console.log('the document is ready');
    // if you manipulate app.state in anyway you should then call
    // app.render();
})
```
## app.window
The `app.window` is an [interactions](#class-interactions) whose baseTarget is `window`.

Example:
```javascript
app.window.on('resize', function (evt, target) {
    console.log('the window has been resized');
    // if you manipulate app.state in anyway you should then call
    // app.render();
})
```

# Interactions
Interactions is a simple user input event router.

## Class: Interactions
* *baseTarget* `Window|Document|Element` The base target for capturing and routing input events.

Example:
```javascript
var interactions = new Interactions(baseTarget);
```

## interactions.on(events[, targetSelector], listener)
* *events* `String` A space separated list of events to listen for.
* *targetSelector* `String` A CCS selector to select the target element.
* *listener* `Function` A listener function that gets call on `events`.

Add event listeners to your `interactions`.

If a `target` is not specified all targets including the `baseTarget` and its descendents will trigger the `listener` on `events`.

Example:
```javascript
interactions.on('click', '.something', function (evt, $el) {
    alert('you clicked on something');

    // target maybe the baseTarget or any of its descendents whos selector matches the target selector.
});

interactions.on('click', function (evt, target) {
    alert('you clicked on something');

    // target maybe the baseTarget or any of its descendents.
});
```

# Bars
Bars is a lightweight high performance HTML aware templating engine. Bars emits DOM rather than DOM-strings, this means the DOM state is preserved even if data updates happen. Bars can also emit DOM-strings for backend templating if desired. This way one can use Bars for both static content generation and dynamic web application views.

## Class: Bars

Example:
```javascript
var Bars = require('bars');
/*
 * use require('bars/compiled')
 * if your templates are already compiled.
 */

var bars = new Bars();
```
## bars.compile(template)
* *template* `String` A Bars template string.

Returns a new [Renderer](#class-renderer) created from the `template`.

This method is equivalent to calling `bars.build(bars.preCompile(template))`.

NOTE: This method is not available in `require('bars/compiled')` variants.
Also see [bars-browserify](https://github.com/Mike96Angelo/Bars-Browserify).

Example:
```javascript
var renderer = bars.compile('<h1>Hello, {{name}}.</h1>');
```

## bars.preCompile(template)
* *template* `String` A Bars template string.

Returns a object structure representing the `template`.

NOTE: This method is not available in `require('bars/compiled')` variants.
Also see [bars-browserify](https://github.com/Mike96Angelo/Bars-Browserify).

Example:
```javascript
var myCompiledTemplate = bars.preCompile('<h1>Hello, {{name}}.</h1>');
```

## bars.build(compiledTemplate)
* *compiledTemplate* `Object` A Bars compiled template.

Returns a new [Renderer](#class-renderer) created from the `compiledTemplate`.

Example:
```javascript
var renderer = bars.build(myComiledTemplate);
```

## bars.registerBlock(name, func)
* *name* `String` The name of the block helper.
* *func* `Function` The block helper function.

Returns *this* [Bars](#bars).

Example:
```javascript
bars.registerBlock('unless',
    function unlessBlock(args, consequent, alternate, context) {
        var condition = args[0];
        if (condition) {
            alternate();
        } else {
            consequent();
        }
    }
);
/*
 * You can supply a new context to either of the consequent or alternate
 * rendering functions by passing in:
 * context.newContext(data, props)
 *
 * data is the new scoped state
 * props is an object who's properties are Block Props
 * accessible in temples through `@<prop-name>`
 */

/**
 * To use the `unless` block in a template
 * use this {{#unless <condition> [<context-map>]}} {{else}} {{/unless}}.
 */
```

## bars.registerPartial(name, template)
* *name* `String` The name of the partial.
* *template* `String|CompiledTemplate` The template for the partial.

Returns *this* [Bars](#bars).

Example:
```javascript
bars.registerPartial('person', 'I am a partial');

/**
 * To use the `person` partial in another
 * template use this {{>person [<expression>] [<context-map>]}}.
 */
```

## bars.registerComponent(name, component)
* *name* `String` The name of the component.
* *component* `Component` The component's constructor function.

Returns *this* [Bars](#bars).

Example:
```javascript
function MyComponent(data) {
    // `MyComponent` is a constructor function
    // `data` is the initial render data

    var _ = this,
        element = document.createTextNode('');

    _.init   = function init()       { return element; }; // Must return component's element
    _.update = function update(data) { element.textContent = data.name; }; // Called when data changes
    _.update(data);
}

bars.registerComponent('my-component', MyComponent);

/**
 * To use the `my-component` component in another
 * template use this {{?my-component [<expression>] [<context-map>]}}.
 */
```

## bars.registerTransform(name, func)
* *name* `String` The name of the transform helper.
* *func* `Function` The transform helper function.

Returns *this* [Bars](#bars).

Example:
```javascript
bars.registerTransform('upperCase', function upperCase(a) {
    return String(a).toUpperCase();
});

/**
 * To use the `upperCase` transform in a
 * template use this {{@upperCase(<expression>)}}.
 */
```

# Renderer
A renderer is an object that can render/update a DOM view.

## Class: Renderer
* *compiledTemplate* `Object` An object structure containing a pattern for rendering.

## renderer.text(data[, options])
* *data* `Object` Object context for rendering update.
* *options* `Object` Options for indentation.
    * *tabs* `Boolean` Use tabs for indentation.
    * *indent* `Number` Number of spaces to indent with if not using tabs.

Returns DOM-string text.

Renders DOM-string text with `data`.

Example:
```javascript
var renderedText = renderer.text({name: 'Bob'}, {tabs: false, indent: 2});
```

## renderer.update(data)
* *data* `Object` Object context for rendering update.

Returns *this* [Renderer](#renderer)

Updates/renders the view with the new `data`.

Example:
```javascript
renderer.update({name: 'Bob'});
```

## renderer.appendTo(element)
* *element*: `Element` The target element to append the app view to.

Returns *this* [Renderer](#class-renderer).

NOTE: if you do not call `renderer.update(data)`, the view will be empty.  You can call `renderer.update(data)` before or after calling `renderer.appendTo(el)`.

Example:
```javascript
renderer.appendTo(document.body);
```
