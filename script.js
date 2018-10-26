const app = {}; // for jQuery
var eventsJSON = [];
var since = ""; // used to get events upto a certain point in the past

window.addEventListener('load', init);

function init() {
    // Getting the date to recieve events past
    var date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    since = date.toISOString().replace('Z', ''); // Needed due to the different format that JavaScript produces nd the Meetup API accepts
    getEvents();
}

function getEvents() {
    eventsJSON = meetups.map(app.apiGetEvents);

    $.when(...eventsJSON)
        .then((...eventsJSON) => {
            eventsJSON = eventsJSON.map(a => a[0].data) // JSONP => JSON
                .filter(function (event) {
                    return !event.hasOwnProperty("errors"); // For private events
                })
                .reduce((prev, curr) => [...prev, ...curr], [])
                .sort(function (a, b) {
                    return a.time - b.time;
                });
            console.log(eventsJSON); // Array of Events
            getAtendees(eventsJSON);
        });
}

function getAtendees(events) {
    var attendees = events.map(app.apiGetAttendees);

    $.when(...attendees)
        .then((...attendees) => {
            // Array indexing events, with arrays of attendees
            attendees = attendees.map(a => a[0].data);
            // removing events with errors
            attendees = attendees.filter(function (event) {
                return !event.hasOwnProperty("errors");
            }); // removing events with no wanted attendees
            attendees = attendees.reduce((prev, curr) => [...prev, ...curr], []);
            // only get people attending
            attendees = attendees.filter(function (event) {
                return event.response == "yes";
            }); // Array of attendance
            console.log(attendees);
            buildJSON(attendees);
        });
}

function buildJSON(attendees) {
    var people = [];

    for (var i = 0; i < attendees.length; i++) { // Going over every attendee
        var id = attendees[i].member.id.toString();
        if (people.hasOwnProperty(id)) { // if attendee is in people array
            people[id].count++;
        } else { // new attendee in people array
            people[id] = {
                'count': 1,
                'name': attendees[i].member.name,
                'id': id,
                'events': [],
                'groups': []
            };
        } // adding event to person
        people[id].events.push({
            'name': attendees[i].event.name,
            'group_name': attendees[i].group.name,
            'group_url': attendees[i].group.urlname,
            id: attendees[i].event.id.toString(),
            'time': attendees[i].event.time
        });
        // Counting groups attended
        if (hasGroup(people[id].groups, attendees[i].group.name)) {
            people[id].groups[groupIndex(people[id].groups, attendees[i].group.name)].count++;
        } else {
            people[id].groups.push({ // if the state was false, being it doesn't exist in the array
                'url': attendees[i].group.urlname,
                'name': attendees[i].group.name,
                'count': 1
            });
        }
    }

    // sort
    people = people.sort((a, b) => b.count - a.count);

    console.log(people);
    display(people);
}

function display(people) {
    var holder = document.getElementById('events');
    holder.innerHTML = "";
    // Building Each Person HTML Element
    for (var i = 0; i < 50 && i < people.length; i++) {
        var eventsHTML = "", groupsHTML = "";

        // Building Each Person's Events HTML Element
        // Reversing since they are in order from oldest to newest
        people[i].events.reverse().forEach(e => {
            eventsHTML += renderEventWithGroup(e.group_url, e.id, e.name, e.group_name, date(e.time));
        });

        // Building Each Person's Groups HTML Element
        people[i].groups = people[i].groups.sort((a, b) => b.count - a.count);
        for (var group = 0; group < people[i].groups.length; group++) {
            var groupEventsHTML = "";

            // Building Each Person's Groups Events HTML Element
            people[i].events.filter(e => e.group_url.includes(people[i].groups[group].url)).forEach(ge => {
                groupEventsHTML += renderEvent(ge.group_url, ge.id, ge.name, date(ge.time));
            });

            // Using HTML Strings Built to insert the finished Elements
            groupsHTML += renderDropdown(renderGroup(people[i].groups[group].url, people[i].groups[group].name, people[i].groups[group].count), renderList(groupEventsHTML));
        } var personInnerHTML = renderDropdown("Groups (" + people[i].groups.length + ")", renderList(groupsHTML)) + renderDropdown("Meetups (" + people[i].count + ")", renderList(eventsHTML));
        holder.innerHTML += renderPerson((i + 1), people[i].id, people[i].name, people[i].groups.length + " | " + people[i].count, personInnerHTML);
    }
}

// COMPONENT FUNCTIONS

function renderDropdown(title, content) {
    return '<details><summary><p>' + title + '</p></summary>' + content + '</details>';
}

function renderPerson(rank, meetupID, name, count, innerHTML) {
    return renderDropdown('#' + rank + ' <a href="https://www.meetup.com/members/' + meetupID + '" target="_blank">' + name + '</a> (' + count + ')', '<ol>' + innerHTML + '</ol>');
}

function renderEventWithGroup(groupURL, eventID, eventName, groupName, time) {
    return '<li><a href="https://www.meetup.com/' + groupURL + '/events/' + eventID + '" target="_blank">' + shorternText(eventName) + '</a> (<a href="https://www.meetup.com/' + groupURL + '" target="_blank">' + shorternText(groupName) + '</a>) ' + time + '</li>';
}

function renderEvent(groupURL, eventID, eventName, time) {
    return '<li><a href="https://www.meetup.com/' + groupURL + '/events/' + eventID + '" target="_blank">' + shorternText(eventName) + '</a> ' + time + '</li>';
}

function renderGroup(groupURL, groupName, count) {
    return '<li><a href="https://www.meetup.com/' + groupURL + '" target="_blank">' + groupName + '</a> (' + count + ')</li>';
}

function renderList(event) {
    return '<ol>' + event + '</ol>';
}

// OTHER FUNCTIONS

function shorternText(t) {
    return (t.length > 32) ? t.substr(0, 30) + "..." : t;
}

function hasGroup(groups, name) {
    if (groups.length == 0) {
        return false;
    } else {
        for (var i = 0; i < groups.length; i++) if (groups[i].name.includes(name)) return true; return false;
    }
}

function groupIndex(groups, name) {
    for (var i = 0; i < groups.length; i++) if (groups[i].name.includes(name)) return i;
}

function date(time) {
    var date = new Date(time);
    return ("0" + date.getDate().toString()).substr(-2) + "/" + ("0" + (date.getMonth() + 1).toString()).substr(-2) + "/" + (date.getFullYear().toString()).substr(2);

}

// API CALLS

app.apiGetEvents = (meetup) => $.ajax({
    url: 'https://api.meetup.com/' + meetup + '/events?&status=past&no_earlier_than=' + since,
    method: 'GET',
    dataType: 'jsonp'
});

app.apiGetAttendees = (event) => $.ajax({
    url: 'https://api.meetup.com/' + event.group.urlname + '/events/' + event.id + '/rsvps?&sign=true&photo-host=public',
    method: 'GET',
    dataType: 'jsonp'
});