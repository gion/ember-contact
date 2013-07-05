var App = Ember.Application.create();

App.Router.map(function () {
	this.resource('view', {path: 'view/:id'}, function(){
		this.route('view');
	});

	this.resource('edit', {path: 'edit/:id'}, function(){
		this.route('edit');
	});

	this.resource('add', {path: '/'}, function(){
		this.route('add');
	});
});

App.ApplicationRoute = Ember.Route.extend({
	setupController: function(controller) {
		controller.set('contacts', App.Contact.find());
	},

    model: function(){
    	return App.Contact.find();
    }
});

// redirect the default index route to the "add" route
App.IndexRoute = Ember.Route.extend({
	redirect: function(){
		this.transitionTo('add');
	}
});

App.AddRoute = Ember.Route.extend({
	model: function(){
		return App.Contact.createRecord();
	},

	renderTemplate: function(){
		this.render('add', {
			into: 'application'
		});
	},

	serialize: function(model){
		return model;
	}
});

App.ViewRoute = Ember.Route.extend({
	model: function(params){
		return App.Contact.find(params.id);
	},

	renderTemplate: function(){
		this.render('view', {
			into: 'application' 
		});

		var controller = this.controllerFor('application');
	},

	serialize: function(model){
		return model;
	}
});

App.EditRoute = Ember.Route.extend({
	model: function(params){
		return App.Contact.find(params.id);
	},

	renderTemplate: function(){
		this.render('edit', {
			into: 'application'
		});
	},

	serialize: function(model){
		return model;
	}
});

// store 

App.Store = DS.Store.extend({
	revision: 13,
	adapter: DS.LSAdapter.create({
	  namespace: 'ember-contacts-take2'
	})
});


// models
App.Contact = DS.Model.extend({
	name: DS.attr('string'),
	email: DS.attr('string'),
	tel: DS.attr('number'),
	isCompleted: DS.attr('boolean')
});


App.EditController = App.AddController = Ember.ObjectController.extend({
	nameError: function(){
		var name = this.get('name');
		return !name || /[-_0-9]/.test(this.get('name'));
	}.property('name'),

	emailError: function(){
		var email = this.get('email');
		return email && !/^\S+@\S+\.\S+$/.test(this.get('email'));
	}.property('email'),

	telError: function(){
		var tel = this.get('tel');
		return tel && !/^\d{10,15}$/.test(tel);
	}.property('tel'),

	anyError : function(){
		return this.get('nameError') || this.get('emailError') || this.get('telError');
	}.property('nameError', 'emailError', 'telError'),

	save : function(){
		if(this.get('anyError'))
			return;

		this.set('isCompleted', true);

		// save the changes
		this.get('store').commit();

		this.transitionToRoute('view', this.get('model'));
	},

	remove : function(){
	    var store = this.get('store');
	    
	    store.transaction();
		store.find(App.Contact, this.get('id')).deleteRecord();
	    store.commit();

		this.transitionToRoute('add');
	}
});




App.ContactsController = Ember.ArrayController.extend({
	
});


App.ApplicationController = Ember.ObjectController.extend({

	// the query from the input
	query : '',

	// the array holding the search results
	searchResults : function(){
		var r = RegExp(this.get('query'), 'i');

		return this.get('contacts').filter(function(contact){
			var name = contact.get('name');
			return !!name && r.test(name);
		});
	}.property('query', 'contacts.@each.name'),

	// specify that our content is a "ContactsController" instance
	contacts: App.ContactsController.create(),

	contactsList : function(){
		var list = {},
			listKey,
			arr = [];

		this.get('contacts').forEach(function(el, i){
			var name = el.get('name');
			
			if(!name /*|| !el.get('isCompleted')*/) 
				return;
			
			listKey = name.substring(0, 1).toLowerCase();
			
			if(!list[listKey]){
				arr.push({
					key: listKey, 
					list: list[listKey] = []
				});
			}

			list[listKey].push(el);
		});

		// sort the names in each group alphabetically
		arr.forEach(function(el, i){
			el.list = el.list.sort();
		});

		// sort the main contact groups alphabetically
		return arr.sort(function(a, b){
			return a.key.localeCompare(b.key);
		});

	}.property('contacts.@each')
});