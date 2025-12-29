document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
          <ul id="participants-${name}" class="participant-list">
            <!-- Participants will be loaded here -->
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Load participants for each activity
        loadParticipants(name);
      });

  // Delegate clicks for delete buttons (event delegation)
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('delete-btn')) {
      const activity = e.target.dataset.activity;
      const email = e.target.dataset.email;
      if (!activity || !email) return;

      if (!confirm(`Unregister ${email} from ${activity}?`)) return;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          loadParticipants(activity);
        } else {
          const res = await response.json();
          console.error('Failed to remove participant:', res);
          alert(res.detail || 'Failed to remove participant');
        }
      } catch (err) {
        console.error(err);
        alert('Error removing participant');
      }
    }
  });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Load participants for a given activity
  async function loadParticipants(activityName) {
    try {
      const response = await fetch(`/activities/${activityName}/participants`);
      const data = await response.json();
      const participantsList = document.getElementById(`participants-${activityName}`);

      // Clear existing participants
      participantsList.innerHTML = "";

      data.participants.forEach(participant => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <span class="participant-email">${participant}</span>
          <button class="delete-btn" data-activity="${activityName}" data-email="${participant}" aria-label="Unregister ${participant}">✖</button>
        `;
        participantsList.appendChild(listItem);
      });
    } catch (error) {
      console.error(`Error fetching participants for ${activityName}:`, error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh the activities and participants to reflect the new signup
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
