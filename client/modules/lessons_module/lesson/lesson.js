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

Template.lesson.helpers({
    username: function(){
        return Meteor.users.findOne(this.author).username;
    },
    avatar: function(){
        return Meteor.users.findOne(this.author).avatar;
    },
    dateFrom: function(date){
        return smartDate(date);
    },
    isOwner: function(){
        return this.author == Meteor.userId();
    },
    isNotOwner: function(){
        return this.author !== Meteor.userId();
    },
    userEnrolled: function(){
        return UsersEnrolled.findOne({user_id: Meteor.userId()});
    },
    sectionActive: function(){
        return Session.get('currentSection');
    },
    tabNamesArray: function(){
        return [{template: 'sectionsTabContent', name: 'sections', icon: 'fa-bookmark', initialActive: true},
                {template: 'commentsTabContent', name: 'comments', icon: 'fa-comments'},
                {template: 'usersTabContent',    name: 'users', icon: 'fa-users'}];
    },
    hasTags: function(){
        return (this.tags) ? this.tags.length : false;
    },
    voted: function(){
        return (Votes.findOne({user_id: Meteor.userId()}))? 'active' : '';
    },
    helpEntries: function(){
        return [
            {text: 'How can I edit my lesson?', url: 'tutorials?section=lessons-section&subsection=5'},
            {text: 'How can I subscribe at this lesson?', url: 'tutorials?section=lessons-section&subsection=8'},
            {text: 'How can I create sections for this lesson?', url: 'tutorials?section=lessons-section&subsection=2'},
            {text: 'How can I create a recording for this lesson?', url: 'tutorials?section=lessons-section&subsection=3'},
            {text: 'How can I write a comment for this lesson?', url: 'tutorials?section=lessons-section&subsection=7'}
        ];
    }
});

Template.lesson.events({
    'click .vote-button': function(e){
        $like = $(e.currentTarget);

        ($like.hasClass('active')) ? $like.removeClass('active') : $like.addClass('active');

        Meteor.call('voteLesson',this._id,Meteor.userId(),($like.hasClass('active'))? 1 : -1);

        var paramsNotification = {
            to: [this.author],
            from: Meteor.userId(),
            createdAt: new Date(),
            contextTitle: this.title,
            type: 'lesson',
            action: ($like.hasClass('active'))? 'likeLesson' : 'removeLikeLesson',
            urlParameters: {template: 'lesson', _id: this._id}
        };

        NotificationsCreator.createNotification(paramsNotification,function(err){
            if(err)console.log('create Notification ERROR: likeLesson: ' + err.reason);
        });
    },
    'click .creator-box .avatar, click .creator-box .author': function(){
        Session.set('currentProfileId',this.author);
        Router.go('profile',{_id: this.author},{query: 'initialSection=channelsTabContent'});
    },
    'click .enrol-button': function(e){
        Meteor.call('insertUserEnrolledLesson',this._id,Meteor.userId(),function(err,res){
            if(err) console.log('insertUserEnrolledLesson ERROR: ' + err.reason);
            if(res) console.log(res);
        });
        var paramsNotification = {
            to: [this.author],
            from: Meteor.userId(),
            createdAt: new Date(),
            contextTitle: this.title,
            type: 'lesson',
            action: 'subscription',
            urlParameters: {template: 'lesson', _id: this._id}
        };
        NotificationsCreator.createNotification(paramsNotification,function(err){
            if(err) console.log('subscriptionLesson Notification ERROR: ' + err.reason);
        });
    },
    'click #cancel-subscription-button': function(){
        Meteor.call('removeUserEnrolledLesson',this._id,Meteor.userId(),function(err,res){
            if(err) console.log('removeUserEnrolledLesson ERROR: ' + err.reason);
            if(res) console.log(res);
        });
        var paramsNotification = {
            to: [this.author],
            from: Meteor.userId(),
            createdAt: new Date(),
            contextTitle: this.title,
            type: 'lesson',
            action: 'cancelSubscription',
            urlParameters: {template: 'lesson', _id: this._id}
        };
        NotificationsCreator.createNotification(paramsNotification,function(err){
            if(err) console.log('cancelSubscriptionLesson Notification ERROR: ' + err.reason);
        });

    },
    'click #edit-button': function(){
        Router.go('lessonEdit',{_id: this._id});
    },
    'focus .form-section input': function(){
        $('.form-section').addClass('active');
    },
    'blur .form-section input': function(e){
        $('.form-section').removeClass('active');
    },
    'click .filter': function(e){
        var elem = e.currentTarget;
        $('.filter').removeClass('active');
        $(elem).addClass('active');
    },
    'submit #saveForm': function(e){
        e.preventDefault();
        var sectionTitle = $(e.target).find("[name=title]").val();
        var section = {
            title: sectionTitle,
            order: Sections.find().count(),
            lesson_id: this._id,
            createdAt: new Date(),
            records_count: 0
        };
        $('#savePanel').modal('hide');
        Meteor.call('insertSection',section,function(err,res){
            if(err) console.log('insertSection ERROR: ' + err.reason);
            if(res) console.log(res);
        });
        var paramsNotification = {
            createdAt: new Date(),
            contextTitle: this.title,
            type: 'lesson',
            new: {title: sectionTitle},
            action: 'newSection',
            urlParameters: {template: 'lesson', _id: this._id}
        };
        paramsNotification.to = [];
        _(UsersEnrolled.find({context_id: this._id}).fetch()).each(function(obj){
            if (obj.user_id != Meteor.userId()) paramsNotification.to.push(obj.user_id);
        });
        NotificationsCreator.createNotification(paramsNotification,function(err,result){
            if(err) console.log('createNotification ERROR: ' + err.reason);
            if(result) console.log('created new Notification');
        });
    },
    'submit #form-comment': function(e){
        e.preventDefault();
        console.log('comentarioo!!');
        var text = $(e.currentTarget).find('textarea').val();
        if (text){
            var comment = {
                createdAt: new Date(),
                author: Meteor.userId(),
                text: text,
                contextId: this._id,
                replies_count: 0,
                isReply: false
            };
            Meteor.call('insertComment',comment);
            Meteor.call('incrementLessonComment',this._id);
            $(e.currentTarget).find('textarea').val('');
        }
        if(this.author != Meteor.userId()){
            var paramsNotification = {
                to: [this.author],
                from: Meteor.userId(),
                createdAt: new Date(),
                contextTitle: this.title,
                type: 'lesson',
                action: 'newCommentLesson',
                urlParameters: {template: 'lesson', _id: this._id}
            };

            NotificationsCreator.createNotification(paramsNotification,function(err,result){
                if(err) console.log('createNotification ERROR: ' + err.reason);
                if(result) console.log('created new Notification');
            });
        }
    }
});

Template.lesson.rendered = function(){
    Session.set('author',this.data.author);
    $('#sections-count').tooltip({placement: 'left', title: 'sections'});
    $('#comments-count').tooltip({placement: 'bottom', title: 'comments'});
    $('#votes-count').tooltip({placement: 'bottom', title: 'votes'});
    $('#users-count').tooltip({placement: 'right', title: 'users'});
    $('.vote-button').tooltip({placement: 'top',text: 'vote'});
    $('#edit-button').tooltip({placement: 'bottom',text: 'edit'});
    Session.set('contextType','lesson');
};


//sectionsTab
Template.sectionsTabContent.helpers({
    isOwner: function(){
        return Router.current().data().author === Meteor.userId();
    },
    sections: function(){
        return  Sections.find({},{sort: {order: 1}});
    },
    userEnrolled: function(){
        return this.author == Meteor.userId() || UsersEnrolled.findOne({user_id: Meteor.userId()});
    }
});

Template.sectionsTabContent.events({
    'click #sections-filter': function(){
        Session.set('currentFilter','sections-filter');
    }

});

Template.sectionsTabContent.rendered = function(){
    $('#sections-filter').click();
    Session.set('formType','createSectionForm');
};


//usersTab
Template.usersTabContent.helpers({
    users: function(){
        return UsersEnrolled.find();
    }
});

Template.usersTabContent.events({
    'click #sections-filter': function(){
        Session.set('currentFilter','users-filter');
    }
});

Template.usersTabContent.rendered = function(){
    $('#users-filter').click();
};


//Items

Template.userItem.helpers({
    username: function(){
        return Meteor.users.findOne(this.user_id).username;
    },
    avatar: function(){
        return Meteor.users.findOne(this.user_id).avatar;
    }
});

Template.userItem.events({
    'click .userItem .avatar, click .userItem .username': function(){
        Session.set('currentProfileId',this.user_id);
        Session.set('currentSection','channelsTabContent');
        Router.go('profile',{_id: this.user_id},{query: 'initialSection=channelsTabContent'});
    }
});

Template.sectionItem.helpers({
    isOwner: function(){
        return Router.current().data().author === Meteor.userId();
    },
    isEmpty: function(){
        return !this.records_count;
    },
    tracks: function(){
        return Records.find({section_id: this._id, isReply: false},{sort: {order: 1}});
    },
    queryObject: function(){
        return {
            lesson: Router.current().params._id,
            section: this._id,
            order: Records.find({lesson_id: this.lesson_id, section_id: this._id}).count()
        };
    },
    hasTracks: function(){
        return Records.find({section_id: this._id, isReply: false}).count();
    },
    firstTrackId: function(){
        return {
            _id: Records.find({section_id: this._id, isReply: false},{sort: {order: 1}}).fetch()[0]._id
        }
    }
});

Template.sectionItem.events({
    'click .delete-section': function(){
        var paramsNotification = {
            createdAt: new Date(),
            contextTitle: Lessons.findOne(this.lesson_id).title,
            type: 'lesson',
            new: {title: this.title},
            action: 'removeSection',
            urlParameters: this.lesson_id
        };
        paramsNotification.to = [];
        _(UsersEnrolled.find({context_id: this.lesson_id}).fetch()).each(function(obj){
            if (obj.user_id != Meteor.userId()) paramsNotification.to.push(obj.user_id);
        });
        NotificationsCreator.createNotification(paramsNotification,function(err,result){
            if(err) console.log('createNotification ERROR: ' + err.reason);
            if(result) console.log('created new Notification');
        });
        Meteor.call('removeSection',this._id,function(err){
            if(err) throw new Meteor.Error('500','ERROR removeSection: ' + err.reason);
        });
    },
    'click .show-tracks': function(e,template){
        if ($(template.find('.sectionItem-vertical')).hasClass('active')){
            if($(template.find('.section-track-list')).hasClass('active')){
                $(template.find('.sectionItem-vertical')).removeClass('active');
                $(template.find('.section-track-list')).removeClass('active');
            }else{
                $(template.find('.section-config-form')).removeClass('active');
                $(template.find('.section-track-list')).addClass('active');
            }
        }else{
            $(template.find('.sectionItem-vertical')).addClass('active');
            $(template.find('.section-track-list')).addClass('active');
        }
    },
    'click .config-section': function(e,template){
        if ($(template.find('.sectionItem-vertical')).hasClass('active')){
            if($(template.find('.section-config-form')).hasClass('active')){
                $(template.find('.sectionItem-vertical')).removeClass('active');
                $(template.find('.section-config-form')).removeClass('active');
            }else{
                $(template.find('.section-track-list')).removeClass('active');
                $(template.find('.section-config-form')).addClass('active');
            }
        }else{
            $(template.find('.sectionItem-vertical')).addClass('active');
            $(template.find('.section-config-form')).addClass('active');
        }
    }
});

Template.sectionItem.rendered = function(){
    $('.delete-section').tooltip({placement: 'top', title: 'delete'});
    $('.config-section').tooltip({placement: 'top',title: 'settings'});
    $('.counter-tracks').tooltip({placement: 'top',title: 'tracks'});
};

Template.sectionTracks.helpers({
    hasTracks: function(){
        return this.tracks.count();
    }
});

Template.trackItem.events({
    'click .trackItem': function(){
        Router.go('record',{_id: this._id});
    }
});

Template.sectionConfig.helpers({
    hasTracks: function(){
        return this.tracks.count();
    }
});

Template.trackItemConfig.helpers({
    notFirst: function(){
        return this.order > 0;
    },
    notLast: function(){
        return this.order < Records.find({section_id: this.section_id}).count() - 1;
    },
    notReplies: function(){
        return !this.replies_count;
    }
});

Template.trackItemConfig.events({
    'click .change-order': function(e){
        Meteor.call('changeTrackOrder',{
            order: this.order,
            record_id: this._id,
            section_id: this.section_id,
            mode: ($(e.currentTarget).hasClass('up'))? 'up' : 'down'
        });
    },

    'click .delete-track': function(){

        Meteor.call('recordRemove',this._id,function(err){
            Session.set('removing',false);
            if (err)throw new Meteor.Error('500','ERROR: removing a record');
        });
    }
});