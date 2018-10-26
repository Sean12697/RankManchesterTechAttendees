# Rank Manchester Tech Attendees

For lack of a better title, ***Rank Manchester Tech Attendees*** shows the 50 most prolific networkers in the (specific) Manchester Meetup Tech scene in the past year.

It uses a manually currated Meetup Group list made for [Manchester Tech Meetups](http://mcrmeetup.tech/) and unfortunaly due to the Meetup API, some events from certain groups cannot be accessed, either due to the whole group being deleted, or the groups events being private (not being accessible from the public Meetup API).

## Usage

This is a simple front-end webpage I created for fun which makes API calls from JavaScript (using jQuery AJAX) and runs statically, feel free to fork it, although you may wish to make a few modifications.

### Different Groups

If you wish to use a different set of Meetup Groups for different purposes, locate the line below in the [*index.html*](index.html) file.

```html
<script src="meetups.js"></script>
```

This is a varible defined as `meetups` and contains an array of groups to be used in the API call defined on [Meetup](https://www.meetup.com/meetup_api/docs/:urlname/events/#list), the array can be modified to contain any groups you wish.

### Timespan

If you wish to view the most prolific people in a short or longer time period, you can find the following line in the [*script.js*](script.js) and change it accordingly.

```javascript
date.setFullYear(date.getFullYear() - 1);
```

### Top *x*

If you wish to show more or less people in your use case, you can locate the following line in the `display` function and modify the for loops number accordingly (currently set to 50):

```javascript
for (var i = 0; i < 50 && i < people.length; i++) {
```

### Layout / Design

How I have inserted items is through a lazy method, in which I use the `innerHTML` property of an element to add a string of HTML I build based on the JSON Object I create.

This JSON Object is the `people` varible passed into the `display` function, which then uses 'render' functions I have made in the JavaScript, the format for the JSON is as follows:

```json
[{
    count: 109,
    name: "Sean O.",
    id: "196309666",
    events: [{
        name: "Kotlin in Android",
        group_name: "Android Manchester",
        group_url: "android_mcr",
        id: "244086317",
        time: 1508178600000
    }, {
        ...
    }],
    groups: [{
        count: 10,
        name: "Tech for Good Live",
        url: "Tech-for-Good-Live"
    }, {
        ...
    }]
}, {
    ...
}]
```