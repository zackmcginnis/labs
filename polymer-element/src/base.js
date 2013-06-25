/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  var base = {
    PolymerBase: true,
    // user entry point for constructor-like initialization
    ready: function() {
      this.super();
    },
    // system entry point, do not override
    readyCallback: function() {
      // install property observers
      // do this first so we can observe changes during initialization
      this.observeProperties();
      // install boilerplate attributes
      this.copyInstanceAttributes();
      // process input attributes
      this.takeAttributes();
      // add host-events...
      //var hostEvents = scope.accumulateHostEvents.call(this);
      //scope.bindAccumulatedHostEvents.call(this, hostEvents);
      // unless this element is inserted into the main document
      // (or the user otherwise specifically prevents it)
      // bindings will self destruct after a short time; this is 
      // necessary to make elements collectable as garbage
      // when polyfilling Object.observe
      this.asyncUnbindAll();
      // process declarative resources
      this.parseElements(this.__proto__);
      // user initialization
      this.ready();
    },
    // recursive ancestral <element> initialization, oldest first
    parseElements: function(p) {
      if (p && p.element) {
        this.parseElements(p.__proto__);
        p.parseElement.call(this, p.element);
      }
    },
    // parse input <element> as needed, override for custom behavior
    parseElement: function(elementElement) {
      this.shadowFromTemplate(elementElement.querySelector('template')); 
    },
    // utility function that creates a shadow root from a <template>
    shadowFromTemplate: function(template) {
      if (template) {
        // apply MDV strategy
        // TODO(sjmiles): we have to apply this strategy directly for the root 
        // template in createInstance (below), but we also need the attribute 
        // here so sub-templates can see it
        template.setAttribute('syntax', 'MDV_STRATEGY');
        // cache elder shadow root (if any)
        var elderRoot = this.shadowRoot;
        // make a shadow root
        var root = this.createShadowRoot();
        // memoize the elder root
        root.olderShadowRoot = elderRoot;
        // migrate flag(s)
        root.applyAuthorStyles = this.applyAuthorStyles;
        // TODO(sjmiles): override createShadowRoot to do this automatically
        CustomElements.watchShadow(this);
        // TODO(sorvell): host not set per spec; we set it for convenience
        // so we can traverse from root to host.
        root.host = this;
        // stamp template
        // which includes parsing and applying MDV bindings before being 
        // inserted (to avoid {{}} in attribute values)
        // e.g. to prevent <img src="images/{{icon}}"> from generating a 404.
        var dom = this.instanceTemplate(template);
        // append to shadow dom
        root.appendChild(dom);
        // perform post-construction initialization tasks on shadow root
        this.shadowRootCreated(root);
        // return the created shadow root
        return root;
      }
    },
    shadowRootCreated: function(root) {
      // to resolve this node synchronously we must process custom elements 
      // in the subtree immediately
      CustomElements.takeRecords();
      // locate nodes with id and store references to them in this.$ hash
      this.marshalNodeReferences.call(root);
      // add local events of interest...
      //var events = scope.accumulateEvents(root);
      //scope.bindAccumulatedLocalEvents.call(this, root, events);
      // set up pointer gestures
      PointerGestures.register(root);
      // set up pointer events
      var touchAction = this.getAttribute('touch-action')
      PointerEventsPolyfill.setTouchAction(root, touchAction);
    },
    // locate nodes with id and store references to them in this.$ hash
    marshalNodeReferences: function(inRoot) {
      // establish $ instance variable
      var $ = this.$ = this.$ || {};
      // populate $ from nodes with ID from the LOCAL tree
      if (inRoot) {
        var nodes = inRoot.querySelectorAll("[id]");
        forEach(nodes, function(n) {
          $[n.id] = n;
        });
      }
    }
  };

  function isBase(object) {
    return object.hasOwnProperty('PolymerBase') 
  }

  // name a base constructor for dev tools

  function PolymerBase() {};
  base.constructor = scope.Base = PolymerBase;

  // exports

  scope.isBase = isBase;
  scope.api = {
    base: base
  };
  
})(Polymer);