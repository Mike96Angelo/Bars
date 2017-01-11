## Table of Contents

* [App](#app)
    * [App.Bars](#appbars)
    * [Class: App](#class-app)
        * [app.state](#appstate)
        * [app.render()](#apprender)
        * [app.on(events, target, listener)](#apponevents-target-listener)
        * [app.appendTo(element)](#appappendtoelement)
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
        * [Renderer.update(data)](#rendererupdatedata)
        * [Renderer.appendTo(element)](#rendererappendtoelement)

# App
Bars App is a simple wrapper around Bars that gives you a cleaner interface.  Bars App also gives you a nice way to bind DOM interactions/events to functionality within your app.

![Bars Render Cycle](bars-render-cycle.png)

# App.Bars
App contains an accessible reference to [Bars](#bars) for your convenience.

# Class: App
* *options* `Object` Options including: template, partials, and transforms.
* *state* `Object` An object which is the App State used to render the App View.

Example:
```javascript
var App = require('bars/app');
/*
 * use require('bars/compiled/app')
 * if templates your templates are already compiled.
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

# app.state
App state is an object/structure from which the app view is rendered.

# app.render()
This is the method you would call to update the app view.  After you manipulate the app state you should call this method to update the view.

# app.on(events, target, listener)
* *events* `String` A space separated list of events to listen for.
* *target* `String` A CCS style selector to select the target element.
* *listener* `Function` A listener function that gets call on `events`.

Add event listeners to your app to make it interactive.

Example:
```javascript
app.on('click', '.something', function (evnt, $el) {
    alert('you clicked on something');

    // if you manipulate part of the app state
    // call app.render()
    // to update the app view.
});
```

# app.appendTo(element)
* *element* `Element` The target element to append the app view to.

Use this method to add the app to the page.

Example:
```javascript
app.appendTo(document.body);
```

# Bars
# Class: Bars
# bars.compile(template)
# bars.preCompile(template)
# bars.build(compiledTemplate)
# bars.registerBlock(name, func)
# bars.registerPartial(name, builtTemplate)
# bars.registerTransform(name, func)
# Renderer
# Class: Renderer
# renderer.update(data)
# renderer.appendTo(element)
