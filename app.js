var App = Ember.Application.create();

// routers
// routes : / | view/x | edit/x

App.Router.map(function () {
	this.resource('add', {path: '/'}, function(){
		this.resource('view', {path: 'view/:id'}, function(){
			this.route('view');
		});

		this.resource('edit', {path: 'edit/:id'}, function(){
			this.route('edit');
		});

		this.route('add');
	});

/*	// when navigating to one of the following routes (view/edit/add),
	// make sure that their corresponding templates are rendered
	// as the "outlet" into the application template  
	this.route('add');*/

});

App.ApplicationRoute = Ember.Route.extend({
    renderTemplate: function() {
        // Render default outlet   
        this.render();
    },

	setupController: function(controller) {
		controller.set('contacts', App.Contact.find());
		controller.updateContactsList();
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
	revision: 12,
//	adapter: 'DS.FixtureAdapter'
	adapter: DS.LSAdapter.create({
	  namespace: 'ember-contacts'
	})
});
/*
App.LSAdapter = DS.LSAdapter.extend({
	namespace : 'ember-contacts'
});*/

// models
App.Contact = DS.Model.extend({
	name: DS.attr('string'),
	email: DS.attr('string'),
	tel: DS.attr('number'),
	isCompleted: DS.attr('boolean'),

//	group : DS.belongsTo('App.ContactGroup'),

	contactDidChange: function () {
		Ember.run.once(this, function () {
			this.get('store').commit();
		});
	}.observes('isCompleted', 'name')
});

/*App.ContactGroup = DS.Model.extend({
  trackers: DS.hasMany('App.Contact')
});*/

App.Contact.FIXTURES = [
	{
		id: 1,
		name: 'joe beef',
		email: 'joe@beef.com',
		tel: 1234567890,
		isCompleted: true
	},
	{
		id: 2,
		name: 'john snow',
		email: 'snow@winterfell.com',
		tel: 1231231321,
		isCompleted: false
	}
];


App.EditController = App.AddController = Ember.ObjectController.extend({
	nameError: function(){
		var name = this.get('name');
		return !name || /[-_0-9]/.test(name);
	}.property('name'),

	emailError: function(){
		var email = this.get('email');
		return !email || !/^\S+@\S+\.\S+$/.test(email);
	}.property('email'),

	telError: function(){
		var tel = this.get('tel');
		return !tel || !/^\d{10,15}$/.test(tel);
	}.property('tel'),

	anyError : function(){
		return this.get('nameError') || this.get('emailError') || this.get('telError');
	}.property('nameError', 'emailError', 'telError'),

	save : function(){
		if(this.get('anyError'))
			return;

		// save the changes
		this.get('store').commit();

		this.transitionToRoute('view', this.get('model'));
	}
});




App.ContactsController = Ember.ArrayController.extend({
	
});


App.ApplicationController = Ember.ObjectController.extend({

	// the query from the input
	query : '',

	// the array holding the search results
	searchResults : function(){
		
		var r = RegExp(this.get('query'));

		return this.get('contacts').filter(function(contact){
			return r.test(contact.get('name'));
		});
	}.property('query', 'contacts.@each.name'),

	// specify that our content is a "ContactsController" instance
	contacts: App.ContactsController.create(),
	contactsList: Ember.ArrayController.create(),

	updateContactsList : function(){
		var list = {},
			contacts = this.get('contacts'),
			listKey,
			arr = [];

		contacts.every(function(el, i){
			var name = el.get('name');
			
			if(!name) 
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

		this.contactsList.set('content', arr);
	}//.observes('contacts.@each')
});