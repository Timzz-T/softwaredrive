// create constants for the form and the form controls
const newSessionFormEl = document.getElementsByTagName("form")[0];
const dateInputEl = document.getElementById("date");
const startTimeInputEl = document.getElementById("start-time");
const endTimeInputEl = document.getElementById("end-time");
const STORAGE_KEY = "learner-hours";
const pastSessionContainer = document.getElementById("past-sessions");
const searchbar = document.getElementById("search");

// Listen to form submissions
newSessionFormEl.addEventListener("submit", (event) => {
  // console.log('You have clicked on the button.')
  // Prevent the form from submitting to the server
  // since everything is client-side.
  event.preventDefault();

  // Get the start and end dates from the form.
  const date = dateInputEl.value;
  const startTime = startTimeInputEl.value;
  const endTime = endTimeInputEl.value;

  // Check if the date is invalid
  if (checkDateInvalid(date)) {
    // If the date is invalid, exit.
    return;
  }

  // Check if the times are invalid
  if (checkTimesInvalid(startTime, endTime)) {
    // If the times are invalid, exit.
    
    return;
  }

  // Store the new session in our client-side storage.
  storeNewSession(date, startTime, endTime);

  // Refresh the UI.
  renderPastSessions();

  // Reset the form.
  newSessionFormEl.reset();
});

//Listener for search
searchbar.addEventListener("input", (e) => {
  renderPastSessions(e.target.value)
})

function checkDateInvalid(date) {
  // Check that date is not null.
  if (!date) {
    
    newSessionFormEl.reset();
    // as date is invalid, we return true
    return true;
  }
  // else
  return false;
}

function checkTimesInvalid(startTime, endTime) {
  // Check that end time is after start time and neither is null.
  
  if (!startTime || !endTime || startTime > endTime) {
    newSessionFormEl.reset();
    showMessage("Times invalid", "error");
    // as times are invalid, we return true
    return true;
  }
  // else
  return false;
}

function storeNewSession(date, startTime, endTime) {
  // Get data from storage.
  const sessions = getAllStoredSessions();

  // Add the new session object to the end of the array of session objects.


  // Sort the array so that sessions are ordered by date, from newest to oldest.
  sessions.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  const isOverlapping = sessions.some(s => {
    if (s.date !== date) return false;
    
    const newStart = startTime;
    const newEnd = endTime;
    const existingStart = s.startTime;
    const existingEnd = s.endTime;

    return newStart < existingEnd && newEnd > existingStart;
  });


  if (isOverlapping) {
    showMessage("This session overlaps with an existing one on the same date", "error");
    return;
  }

  sessions.push({
    id: Date.now(), //adds unique id
    date: sanitise(date),
    startTime: sanitise(startTime),
    endTime: sanitise(endTime)
   });

  // Store the updated array back in the storage.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function sanitise(input) {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

function getAllStoredSessions() {
  // Get the string of session data from localStorage
  const data = window.localStorage.getItem(STORAGE_KEY);

  // If no sessions were stored, default to an empty array
  // otherwise, return the stored data as parsed JSON
  const sessions = data ? JSON.parse(data) : [];

  return sessions;
}

function renderPastSessions(search = "") {

  // get the parsed string of sessions, or an empty array.
  const totalTime = document.getElementById("totalTime");
  const cleanSearch = sanitise(search);
  const sessions = getAllStoredSessions().filter(session => session.date.includes(cleanSearch));

  // clear list and total time
  pastSessionContainer.textContent = "";
  totalTime.textContent = "";

  if (sessions.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No sessions found.";
    pastSessionContainer.appendChild(msg);
    return;
  }

  //function to get total tiem 
  const totalHours = sessions.reduce((sum, s) => {
    const [startHour, startMinute] = s.startTime.split(":").map(Number);
    const [endHour, endMinute] = s.endTime.split(":").map(Number);
    const start = startHour + startMinute/60;
    const end = endHour + endMinute/60;
    return sum + (end - start);
  }, 0);

  // Clear the list of past sessions, since we're going to re-render it.
  pastSessionContainer.textContent = "";

  const pastSessionHeader = document.createElement("h2");
  pastSessionHeader.textContent = "Past sessions";

  const pastSessionList = document.createElement("ul");

  //crate div for total time

  const totalMinutes = Math.round(totalHours * 60);
  const hours = Math.floor(totalMinutes/60);
  const minutes = totalMinutes % 60;
  totalTime.textContent = `Total Time: ${hours}hr ${minutes} min`;

  // Loop over all sessions and render them.
  // create edit and delete buttons for each entry
  sessions.forEach((session, index) => {
    const sessionEl = document.createElement("li");
    sessionEl.innerHTML = `${formatDate(session.date)} from ${formatTime(session.startTime)} to ${formatTime(session.endTime)}
    <button type="button" onclick="editSession(${session.id})">Edit</button>
    <button type="button" onclick="deleteSession(${session.id})">Delete</button>
    `;
    pastSessionList.appendChild(sessionEl);
  });

  pastSessionContainer.appendChild(pastSessionHeader);
  pastSessionContainer.appendChild(pastSessionList);
}

function deleteSession(id) {
  const sessions = getAllStoredSessions();
  console.log("Attempting to delete ID:", id);
  const updated = sessions.filter(s => s.id !== id);
  console.log("Remaining after delete:", updated);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  showMessage("Entry changed", "success");
  renderPastSessions();
}

function editSession(id) {
  const sessions = getAllStoredSessions();
  const session = sessions.find(s => s.id === id);
  if (!session) {
    showMessage("Session not found", "error");
    return;
  }
  //put the current values into the form
  dateInputEl.value =session.date;
  startTimeInputEl.value = session.startTime;
  endTimeInputEl.value  = session.endTime;
  //removing session by id
  deleteSession(id);
}

function formatDate(dateString) {
 
  // Convert the date string to a Date object.
  const date = new Date(dateString);

  // Format the date into a locale-specific string.
  return date.toLocaleDateString();

}

function formatTime(timeString) {
  // Change from 24-hour to 12-hour format

  // Separate hour and minutes from timeString
  const [hour, minute] = timeString.split(':');

  // Convert hour from string to integer
  intHour= parseInt(hour);

  // Determine if AM or PM
  period = "AM";
  if (intHour > 12) {
    intHour -= 12;
    period = "PM";
  }
 
  // Display 0 hours as 12 AM
  if (intHour == 0) {
    intHour = 12;
  }

  // Format 12 hour time string
  const formattedTime = intHour + ":" + minute + " " + period;

  return formattedTime;
}

function showMessage(text, type="success") {
  const msgEl = document.getElementById("message");
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
  msgEl.classList.remove("hidden");

  //hides after 3s
  setTimeout(() => {
    msgEl.classList.add("hidden")
  }, 3000)
}

renderPastSessions();
  
window.deleteSession = deleteSession;
window.editSession = editSession;