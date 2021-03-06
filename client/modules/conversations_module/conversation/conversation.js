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

Template.conversation.helpers({
    messages: function(){
        return Messages.find({conversation_id: this._id},{sort: {createdAt: 1}});
    },
    membersMinified: function(){
        return (this.members.length > 3)? this.members.slice(0,3): this.members;
    },
    shortSubject: function(s,max){
        return ellipsis(s,max)
    },
    moreUsers: function(){
        return this.members.length > 3;
    },
    restUsersCounter: function(){
        return this.members.length - 3;
    },
    exiting: function(){
        return Session.get('exiting');
    },
    isNotAMember: function(){
        return !_(this.members).some(function(member){
            return member._id == Meteor.userId();
        });
    },
    isLeader: function(){
        return this.author == Meteor.userId();
    },
    banner: function(){
        return _(this.members).find(function(member){return member._id == Meteor.userId()}).bg_img;
    }
});

Template.conversation.events({
    'keyup #message-input': function(){
        /*var cWrapper = $('.conversation-wrapper');
        var cFooter = $('.conversation-footer');
        cWrapper.css('padding-bottom', cFooter.height() + 20 + 'px');
        var content = document.getElementById("messages-list");
        content.scrollTop = content.scrollHeight;*/
    },
    'click #send-button': function(){
        var message = $('#message-input').html();
        if (message){
            var messageObject = {
                author: Meteor.userId(),
                createdAt: new Date(),
                message: message,
                conversation_id: this._id
            };
            var conversation_id = this._id;
            Meteor.call('insertMessage', messageObject, function(err,msg_id) {
                if (err) console.log('insertMessage ERROR: ' + err.reason);
                if (msg_id){
                    Meteor.call('updateLatestMsgConversation',conversation_id,msg_id);
                }
            });
        }
        $('#message-input').html('');
    },
    'click #edit-link, click .edit-conversation': function(){
        Router.go('conversationEdit',{_id: this._id});
    },
    'click .restUsers': function(){
        if($('.usersListPanel').hasClass('active')){
            $('.usersListPanel').removeClass('active');
        }else{
            $('.usersListPanel').addClass('active');
        }

    },
    'click #exit-conversation-button': function(){
        Session.set('exiting',true);
    },
    'click #show-menu-button': function(){
        var $menu = $('#actions-sidebar-wrapper');
        ($menu.hasClass('active'))? $menu.removeClass('active') : $menu.addClass('active');
    },
    'click #delete-messages-button': function(){
        Meteor.call('changeDateFilterMessages',this._id, Meteor.userId(),function(err,res){
            if(err) console.log('changeDateFilterMessages ERROR: ' + err.reason);
        });
    }
});


Template.conversation.created = function(){
    Session.set('memberList',this.data.members);
};

Template.conversation.rendered = function(){
    Session.set('exiting',false);
    Session.set('exited',false);
    console.log(this.data);
    Meteor.call('denyAlerts',this.data._id,Meteor.userId(),function(err){
        if(err) console.log('denyAlerts ERROR: ' + err.reason);
    });
};

Template.conversation.destroyed = function(){
    Session.set('exiting',false);
    Session.set('exited',false);
    Meteor.call('allowAlerts',this.data._id, Meteor.userId(),function(err){
        if(err) console.log('allowAlerts ERROR: ' + err.reason);
    });
};

Template.memberAvatar.helpers({
    avatar: function(){
        return Meteor.users.findOne(this._id).avatar;
    }
});

Template.memberInfo.helpers({
    avatar: function(){
        return Meteor.users.findOne(this._id).avatar;
    },
    username: function(){
        return Meteor.users.findOne(this._id).username;
    }
});

Template.memberInfo.events({
    'click button': function(){
        Router.go('profile',{_id: this._id},{query: 'initialSection=channelsTabContent'});
    }
})

Template.messageItem.helpers({
    avatar: function(){
        return Meteor.users.findOne(this.author).avatar;
    },
    username: function(){
        return Meteor.users.findOne(this.author).username;
    },
    dateFrom: function(d){
        return smartDate(d);
    },
    owner: function(){
        return this.author == Meteor.userId();
    },
    message: function(){
        return new Handlebars.SafeString(this.message);
    }

});

Template.messageItem.rendered = function(){
    var content = document.getElementById("messages-list");
    content.scrollTop = content.scrollHeight;
};

Template.conversationExiting.helpers({
    exited: function(){
        return Session.get('exited');
    },
    isLeader: function(){
        return this.author == Meteor.userId();
    }
});

Template.conversationExiting.events({
    'click #accept-button-exit': function(){
        console.log(this);
        var conversation_id = this._id;
        var message = {
            type: 'info',
            createdAt: new Date(),
            message: Meteor.user().username + ' has left the conversation',
            conversation_id: this._id
        };
        Meteor.call('insertMessage',message,function(err,res){
            if(err) console.log('ERROR message insert: ' + err.reason);
            if(res) {
                Meteor.call('conversationExit',conversation_id,Meteor.userId(),function(err,res){
                    if(err) console.log('ERROR conversation exit: ' + err.reason);
                    if(res) Session.set('exited',true);
                });
            }
        });
    },
    'click #cancel-button-exit': function(){
        Session.set('exiting',false);
    },
    'click #view-profile-button': function(){
        Router.go('profile',{_id: Meteor.userId()},{ query: 'initialSection=conversationsTabContent'});
    },
    'click #view-edit-page': function(){
        Router.go('conversationEdit',{_id: this._id});
    }
});

Template.conversationExiting.rendered = function(){
    Session.set('exited',false);
};

Template.conversationExiting.destroyed = function(){
    Session.set('exited',null);
};

Template.conversationError.events({
    'click #view-profile-button': function(){
        Router.go('profile',{_id: Meteor.userId()},{ query: 'initialSection=conversationsTabContent'});
    }
});