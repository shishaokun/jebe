# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://jashkenas.github.com/coffee-script/
#


document.domain = 'renren.com'

JebeSimulator = Class 

  init: () ->

    this.app = $ '[jebe-app]'
    this.models = $ '[jebe-model]'
    this.simulator = $ '[jebe-simulator]'

    self = this

    this.simulator.on 'load', () ->
      self.simulator = self.simulator[0].contentWindow
      self.models.each (index, item) ->
        item = $ item
        if item.attr 'type' is 'text' or item[0].nodeName is 'textarea'
          item.on 'input', $.proxy self.oninput, self
        else
          item.on 'change', $.proxy self.onchange, self

  trigger: () ->
    data = {}
    this.models.each (index, item) ->
        item = $ item
        data[item.attr 'jebe-model'] = item.val
  	this.simulator.send [data]

  oninput: (e) ->
  	this.trigger e.target.value

  onchange: (e) ->
  	this.trigger e.target.value

$ ()->
  new JebeSimulator