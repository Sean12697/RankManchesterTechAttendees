const app = {}; // for jQuery
var eventsJSON = [];
var since = ""; // used to get events upto a certain point in the past

window.addEventListener('load', init);

function init() {
    // Getting the date to recieve events past
    var date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    since = date.toISOString().replace('Z',''); // Needed due to the different format that JavaScript produces nd the Meetup API accepts
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
            people[id] = {'count': 1, 
                          'name': attendees[i].member.name,
                          'id': id,
                          'events': [] };
        } // adding event to person
        people[id].events.push({ 'name': attendees[i].event.name, 'group_name': attendees[i].group.name, 'group_url': attendees[i].group.urlname, id: attendees[i].event.id.toString(), 'time': attendees[i].event.time });
    }
    
    // sort
    people = people.sort((a, b) => b.count - a.count);
    
    console.log(people);
    display(people);
}

function display(people) {
    var holder = document.getElementById('events');
    holder.innerHTML = "";
    for (var i = 0; i < 50 && i < people.length; i++) {
        var element = '<details><summary><p>#' + (i + 1) + ' <a href="https://www.meetup.com/members/' + people[i].id + '" target="_blank">' + people[i].name + '</a> (' + people[i].count + ') </p></summary><ol>';
            for (var meetup = people[i].events.length - 1; meetup >= 0; meetup--) {
                element += '<li><a href="https://www.meetup.com/' + people[i].events[meetup].group_url + '/events/' + people[i].events[meetup].id + '" target="_blank">' + people[i].events[meetup].name + '</a> ' + date(people[i].events[meetup].time) + '</li>';
            } element += '</ol></details>';
        holder.innerHTML += element;
    }
}

function date(time) {
    var date = new Date(time);
    return  ("0" + date.getDate().toString()).substr(-2) + "/" + ("0" + (date.getMonth() + 1).toString()).substr(-2) + "/" + (date.getFullYear().toString()).substr(2);
    
}

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
