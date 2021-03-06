/**
 *    Copyright (C) 2016 Jorge Ortega Morata.
 *
 *    This program is free software: you can redistribute it and/or  modify
 *    it under the terms of the GNU Affero General Public License, version 3,
 *    as published by the Free Software Foundation.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *    As a special exception, the copyright holders give permission to link the
 *    code of portions of this program with the OpenSSL library under certain
 *    conditions as described in each individual source file and distribute
 *    linked combinations including the program with the OpenSSL library. You
 *    must comply with the GNU Affero General Public License in all respects
 *    for all of the code used other than as permitted herein. If you modify
 *    file(s) with this exception, you may extend this exception to your
 *    version of the file(s), but you are not obligated to do so. If you do not
 *    wish to do so, delete this exception statement from your version. If you
 *    delete this exception statement from all source files in the program,
 *    then also delete it in the license file.
 */

Template.channels.helpers({
	channels: function(){
		switch(Session.get('filter-active')) {
			case 'recent-filter':
				return Channels.find({}, {sort: {createdAt: -1},limit: Session.get('limit')});
			case 'popular-filter':
				return Channels.find({},{sort:{votes_count: -1},limit: Session.get('limit')});
		}
	},
	listMode: function(){
		return Session.get('horizontalMode');
	},
	searching: function(){
		return Session.get('filter-active') == 'search-filter';
	},
	contextSearch: function(){
		return {context: 'channels'};
	},
	has: function(){
		return Channels.find({}).count();
	}
});

Template.channels.events({
	'click .display-option': function(e){
		var elem = e.currentTarget;
		$('.display-option').removeClass('active');
		$(elem).addClass('active');
		if (elem.id == 'list'){
			Session.set('horizontalMode',true);
		}else{
			Session.set('horizontalMode',false);
		}
	},
	'click .filter': function(e){
		var elem = e.currentTarget;
		$('.filter').removeClass('active');
		$(elem).addClass('active');
		Session.set('filter-active',$(elem)[0].id);
		Session.set('limit',LOAD_INITIAL);
	},
	'click .button-circle': function(){
		Router.go('channelSubmit');
	},
	'click #load-more-button': function(){
		Session.set('limit',Session.get('limit') + MORE_LIMIT);
	}
});

Template.channels.rendered = function(){
	Session.set('horizontalMode',true);
	$('.button-circle').tooltip({placement: 'bottom', title: 'create a new Channel'});
};

Template.channels.destroyed = function(){
	Session.set('limit',null);
};

Template.channels.created = function(){
	Session.set('limit',LOAD_INITIAL);
	Session.set('filter-active', 'recent-filter');
};

Template.channelItemHorizontal.helpers({
	shortDescription: function(description,max){
		return ellipsis(description,max);
	},
	authorName: function(){
		return Meteor.users.findOne(this.author).username;
	},
	dateFrom: function(d){
		return smartDate(d);
	}
});

Template.channelItemHorizontal.events({
	'click .image-hover i, click .card-title, click .image-hover, click img': function(){
		Router.go('channel',{_id: this._id}); //voy a la pagina principal del record.
	},
	'click .card-author': function(){
		Router.go('profile',{_id: this.author},{query: 'initialSection=channelsTabContent'});
	}
});

Template.channelItemHorizontal.rendered = function(){
	$('.records-count').tooltip({placement: 'bottom', title: 'records'});
	$('.comments-count').tooltip({placement: 'top', title: 'comments'});
	$('.votes-count').tooltip({placement: 'bottom', title: 'votes'});
	$('.subscriptions-count').tooltip({placement: 'top', title: 'subscriptions'});
};

Template.channelItemVertical.helpers({
	authorName: function(){
		return Meteor.users.findOne(this.author).username;
	},
	dateFrom: function(d){
		return smartDate(d);
	},
	ellipsis: function(s,max){
		return ellipsis(s,max);
	}
});

Template.channelItemVertical.events({
	'click .image-hover i, click .card-title, click .image-hover, click img': function(){
		Router.go('channel',{_id: this._id}); //voy a la pagina principal del record.
	},
	'click .card-author': function(){
		Router.go('profile',{_id: this.author},{query: 'initialSection=channelsTabContent'});
	}
});

Template.channelItemVertical.rendered = function(){
	$('.records-count').tooltip({placement: 'bottom', title: 'records'});
	$('.comments-count').tooltip({placement: 'top', title: 'comments'});
	$('.votes-count').tooltip({placement: 'bottom', title: 'votes'});
	$('.subscriptions-count').tooltip({placement: 'top', title: 'subscriptions'});
};