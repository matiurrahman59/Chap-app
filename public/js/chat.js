const socket = io();

// Elements
const form = document.getElementById('message-form');
const formBtn = document.getElementById('btn');
const formInput = document.getElementById('formInput');
const locationBtn = document.getElementById('send-location');
const messages = document.getElementById('messages');
const sidebar = document.getElementById('sidebar');

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationMessageTemplate = document.getElementById(
  'location-message-template'
).innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  // new message element
  const newMessage = messages.lastElementChild;

  // height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = messages.offsetHeight;

  // height of messages container
  const containerHeight = messages.scrollHeight;

  // how far have dcrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });

  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('locationMessage', (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });

  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  sidebar.innerHTML = html;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  formBtn.setAttribute('disabled', 'disabled');
  const message = formInput.value;

  socket.emit('sendMessage', message, (error) => {
    formBtn.removeAttribute('disabled', 'disabled');
    formInput.value = '';
    formInput.focus();

    if (error) {
      return console.log(error);
    }
    message = '';
    console.log('Message delivered!');
  });
});

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  locationBtn.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      lat: position.coords.latitude,
      long: position.coords.longitude,
    };

    // sending data
    socket.emit('sendLocation', location, () => {
      locationBtn.removeAttribute('disabled', 'disabled');
      console.log('Location Shared');
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
