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
        * [Bars.compile(template)](#barscompiletemplate)
        * [Bars.preCompile(template)](#barsprecompiletemplate)
        * [Bars.build(compiledTemplate)](#barsbuildcompiledtemplate)
        * [Bars.registerBlock(name, func)](#barsregisterblockname-func)
        * [Bars.registerPartial(name, builtTemplate)](#barsregisterpartialname-builttemplate)
        * [Bars.registerTransform(name, func)](#barsregistertransformname-func)
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

# app.state
App state is an object/structure from which the app view is rendered.

# app.render()
This is the method you would call to update the app view.  After you manipulate the app state you should call this method to update the view.

# app.on(events, target, listener)
# app.appendTo(element)
Use this method to add the app to the page.

# Bars
# Class: Bars
# Bars.compile(template)
# Bars.preCompile(template)
# Bars.build(compiledTemplate)
# Bars.registerBlock(name, func)
# Bars.registerPartial(name, builtTemplate)
# Bars.registerTransform(name, func)
# Renderer
# Class: Renderer
# Renderer.update(data)
# Renderer.appendTo(element)
