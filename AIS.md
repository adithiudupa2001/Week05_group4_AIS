Singapore Bus Tracker — UX Prompts

Live site: https://adithiudupakarkadaweek03assignment.vercel.app

Three prompts, reproduced exactly as written. Each is in a copy-paste block.

Prompt 1 — Visibility of System Status
text
ROLE
You are a senior UX designer and front-end engineer improving an EXISTING Singapore bus tracker.
Do not rebuild the product from scratch.
Do not change the visual identity or core functionality.

PRODUCT
Live site:
https://adithiudupakarkadaweek03assignment.vercel.app

USABILITY PRINCIPLE
Nielsen Heuristic #1:
Visibility of System Status

GOAL
Always keep users informed about what the system is doing, especially when bus information is loading, refreshing, unavailable, or encountering an error.

CURRENT PROBLEM
The product provides live bus arrival information, nearby stops, favourites, quick stops, search, and traffic information.
However, users may not always know:
Whether bus arrival data is currently loading
Whether the latest information has finished refreshing
When the displayed bus arrival information was last updated
Whether an action such as locating nearby stops is still in progress
Whether there is a network or data problem
Whether the app is showing live data or temporary fallback information
This can make the interface feel uncertain, especially when users are checking buses while travelling.

TASK
Improve the existing interface so that important system states are clearly communicated to users.
Focus on small improvements to the current product rather than redesigning the application.

IMPLEMENTATION REQUIREMENTS

LOADING STATE
When bus arrival information is being retrieved, clearly show that the system is loading.
Use a lightweight loading indicator, skeleton state, or message such as:
"Loading bus arrivals..."
Do not leave the content area blank while data is loading.

REFRESH STATUS
When live bus data is refreshed, provide brief feedback that the update is happening.
After the refresh completes, clearly indicate that the information has been updated.
Avoid disruptive pop-ups.

LAST UPDATED INFORMATION
Where appropriate, display a subtle timestamp such as:
"Updated just now"
or
"Updated 1 min ago"
This should help users understand how current the bus arrival information is.

LOCATION STATUS
When the app is determining the user's location for nearby stops, show a clear status such as:
"Finding nearby bus stops..."
If location access fails or is unavailable, explain what happened and provide an alternative action.

ERROR AND DATA STATUS
If live bus information cannot be retrieved, clearly explain the status instead of leaving the user uncertain.
Use concise messages such as:
"Unable to load live bus arrivals. Try again."
Provide a visible retry action where appropriate.

EMPTY STATES
Clearly distinguish between:
Data still loading
No buses currently operating
No results found
A technical error
Do not use the same message for different situations.

UX REQUIREMENTS
Keep feedback brief and easy to understand while users are travelling.
Do not overwhelm the interface with unnecessary status messages.
Use existing typography, spacing, colours, and visual patterns.
Status indicators should appear close to the content or action they refer to.
Avoid technical terminology.
Preserve all existing functionality.

CONSTRAINTS
Do not:
Rebuild the application
Change the overall navigation structure
Remove existing features
Add unnecessary animations
Create intrusive modal dialogs
Change the application's visual identity

SUCCESS CRITERIA
After the improvements, a user should always be able to tell whether:
Bus information is loading
Information has successfully refreshed
Displayed information is current
Location detection is in progress
No buses are available
An error has occurred.
Prompt 2 — Consistency and Standards
text
PROMPT 2: Consistency and Standards

Improve the existing Singapore bus tracker by making the design, wording, and interactions more consistent.
Focus on keeping buttons, icons, labels, colours, spacing, bus stop information, arrival times, navigation, loading states, and error messages consistent across the app.
Similar actions should look and behave the same so users can easily predict how the interface works.
Do not redesign the app or change its core functionality.

Error Prevention
Improve the app so common mistakes are prevented before they happen.
Focus on:
Preventing empty or invalid searches
Preventing duplicate actions from repeated taps
Preventing duplicate favourites
Clearly distinguishing Add and Remove Favourite actions
Allowing users to undo accidental favourite removal
Validating bus stop codes or search inputs
Handling location permission problems properly
Disabling actions that are temporarily unavailable
Avoid unnecessary confirmation pop-ups and keep the experience simple.

Recognition Rather Than Recall
Improve the app so users can recognise information instead of having to remember it.
Focus on:
Showing bus stop names together with bus stop codes
Making stop names more prominent than codes
Keeping Favourites, Quick Stops, and Nearby Stops easy to recognise
Showing recent or commonly used stops where useful
Using clear icons and labels
Keeping the current bus stop and service visible
Highlighting the selected tab or item
Keeping common actions such as Search, Refresh, Favourite, and Back easy to find
Do not clutter the interface or add unnecessary new features.
Keep all improvements consistent with the current design and functionality of the app.
Prompt 3 — Match Between System and the Real World
text
PROMPT 3: Match Between System and the Real World

Improve the existing Singapore bus tracker by using familiar language and information that commuters naturally understand.
Focus on:
Using common terms such as Bus Stop, Bus Service, Nearby Stops, Favourites, and Bus Arrivals
Showing arrival times in simple formats such as "Arriving", "2 min", and "8 min"
Displaying bus stop names clearly together with bus stop codes
Using simple, human-friendly messages for empty states and errors
Avoiding technical terms, raw timestamps, or API-related wording
Making traffic updates easy to understand
Using clear search wording such as "Search bus stop or bus service"
Keep the interface simple, familiar, and consistent with how people use public transport in Singapore.
Do not redesign the app or change its core functionality.

User Control and Freedom
Improve the app so users can easily go back, cancel, undo, or recover from mistakes.
Focus on:
Providing clear back navigation on detail screens
Allowing users to easily clear search input
Letting users leave loading or location-based actions without getting stuck
Providing an Undo option after removing a favourite
Preserving search terms, selected tabs.

1. Heuristic #7 — Flexibility & Efficiency

* Add a simple Save/heart action to each rescue card.
* Store saved pet IDs in localStorage.
* Add a small "Saved" filter beside All Rescues / Dogs / Cats.
* Saved pets must persist after refresh.
* If none are saved, show a simple empty state.
* Keep Adopt Me and Schedule a Visit unchanged.

1. Heuristic #8 — Aesthetic & Minimalist Design

* Show only 4 rescue cards initially.
* Add "View all rescues" and allow collapse.
* For bus route results, show only the first route initially.
* Add "View more routes" and allow collapse.
* Do not remove data or change route logic.

1. Heuristic #9 — Error Recognition & Recovery

Improve invalid bus-stop search.
For invalid code 61031, show a clear message such as:
"We couldn't find bus stop 61031.
Check the 5-digit code and try again."
Also provide:

* editable input
* Retry/Search Again
* Clear/Reset
* one valid example bus stop already available in the app

Also handle:

* fewer than 5 digits
* no route found
* API unavailable

Use plain language.
Do not show technical/API errors.
Keep changes minimal.
Do not add packages unless necessary.
Do not refactor unrelated code.
Test:

* Save a pet → refresh → still saved
* Saved filter works
* Rescue list expands/collapses
* Route list expands/collapses
* Invalid 61031 shows recovery options
* Valid 04121 still works

At the end report only:

* files changed
* what changed for #7
* what changed for #8
* what changed for #9
* build PASS/FAIL
