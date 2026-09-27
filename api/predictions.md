1. My product
Live address: https://adithiudupakarkadaweek03assignment.vercel.app
Who it is for, and the one job it does for them: First-time adopters in Singapore who are planning a visit to the Pasir Ris shelter, and the one job it does is let them check the weather and the bus route before they come.
Health check from Step 1, on Sunday 27 September 2026, 10:20 AM: /api/health returned keyConfigured: true with weather and bus both answering 200. Disqus loaded on the live address.
Devices and browsers I used for this evaluation: [PHONE AND BROWSER, LAPTOP AND BROWSER]
2. My findings
Finding 1
Where: On a rescue card, after pressing "Schedule a visit" or "Adopt me", at the contact number field.
What I did, what I saw: I typed a contact number far longer than any Singapore number and submitted. It was accepted with no complaint.
Which heuristic: 5, Error Prevention.
Screen or system: Screen. The page can check the shape of a number before the form is sent.
Severity, and why: 3, driven by what it costs when it happens. A request with an unusable number can never be answered, and neither side knows.
The repair: The field accepts only a number that could be a real Singapore contact number, and says so as it is typed.
Finding 2
Where: Bus Route Finder, in the result for a stop whose journey needs a change of bus.
What I did, what I saw: I searched a stop with no direct service. The first bus was shown prominently; the second bus appeared only inside a line of text below it.
Which heuristic: 4, Consistency and Standards.
Screen or system: Screen. The back end already returns both legs and the interchange.
Severity, and why: 3, driven by whether the person can learn around it. It catches the visitor every time a journey needs a change, and someone who boards only the highlighted bus does not reach the shelter.
The repair: Both legs are shown the same way, in order, with the interchange named between them.
Finding 3
Where: Bus Route Finder, at the "Nearby stops" button.
What I did, what I saw: I pressed it. It returned a location-denied message straight away and no stops appeared.
Which heuristic: 9, Help Users Recognize, Diagnose, and Recover from Errors.
Screen or system: Screen. The page receives the refusal, so it can explain it.
Severity, and why: 3, driven by how often it happens. Every visitor who does not know their stop code reaches for this button first and meets the same dead end.
The repair: When location is refused, the card says so, says how to allow it, and points to typing a stop code instead.
Finding 4
Where: Pasir Ris Weather card, read against the visiting slots lower down the page.
What I did, what I saw: The card gave the next two hours only. Visiting slots run to 5:30pm, so an afternoon visit has no forecast.
Which heuristic: 2, Match Between the System and the Real World.
Screen or system: System. The route behind it returns only a two-hour nowcast.
Severity, and why: 2, driven by whether it damages the product's standing. A visitor who plans a 4pm visit around a 10am forecast was told something the data never claimed.
The repair: The weather covers the time being planned for, or the card says plainly that it does not.
Finding 5
Where: Bus Route Finder, at the stop-code box.
What I did, what I saw: I tried searching by stop name. The box takes five digits only, although the product's own answers and quick-stop chips carry stop names.
Which heuristic: 6, Recognition Rather than Recall.
Screen or system: System. Searching by name needs the route to resolve a name to a code.
Severity, and why: 3, driven by how often it happens. Almost nobody knows their stop code, so nearly every visitor must look it up elsewhere first.
The repair: A visitor can type a stop name and choose from the matches, with the code filled in for them.
Finding 6
Where: Pasir Ris Weather card, at the "LIVE DATA" badge.
What I did, what I saw: The card gives the forecast but never says when it was refreshed, so a page left open shows a stale reading that looks fresh.
Which heuristic: 1, Visibility of System Status.
Screen or system: System. The answer it is sent carries no time.
Severity, and why: 2, driven by whether the person can learn around it. There is no visible difference between a current and an old forecast.
The repair: The answer carries the time the reading was taken, and the card shows it beside the forecast.
3. My predictions
The three findings I expect my groupmates to raise, and the severity I expect for each:
Finding 1, severity 3 — submitting a form with nonsense is a standard way to break a product, and this field gives way at once.
Finding 2, severity 3 — any stop outside the east needs a change of bus, so the half-shown second leg appears on most searches an evaluator tries.
Finding 4, severity 2 — the visiting slots sit on the same page as the forecast, so the gap between them is visible without leaving the screen.
The heuristic I think my product breaks worst: 5, Error Prevention. The contact number field accepts a number that could never be dialled, on the one form where a visitor commits to something real. The studio round repaired error prevention around search and favourites, but never touched the forms, so this is the part of the product that has had the least attention of any.
The finding that would show my own evaluation was wrong: If a groupmate raises a finding of severity 3 or 4 under 1, Visibility of System Status, or 3, User Control and Freedom, about the route search itself — that pressing Search leaves the card unchanged for a long time with nothing to say it is working, or that there is no way back to the previous result once a new search replaces it. The studio round added loading states to the bus arrivals, and I assumed that covered the route search as well, so I never timed a search or tried to undo one.
4. Findings I had already heard in the studio

These were raised in the Week 5 studio and repaired before this evaluation; the prompts used are in prompts.md.

No loading state while bus arrivals were fetched, and no "last updated" time — 1, Visibility of System Status.
One message covered loading, no results, no buses and a technical error alike — 9, Help Users Recognize, Diagnose, and Recover from Errors.
An invalid stop code (61031) gave no plain-language message and no way to retry or clear — 9, Help Users Recognize, Diagnose, and Recover from Errors.
Empty or invalid searches and repeated taps were not prevented; favourites could be duplicated and removed with no undo — 5, Error Prevention.
Stop codes were shown without stop names — 6, Recognition Rather than Recall.
Raw timestamps and technical wording in place of commuter language — 2, Match Between the System and the Real World.
Buttons, labels and wording behaved differently for the same action across screens — 4, Consistency and Standards.
No way to clear a search, go back or undo, and location actions could leave the user stuck — 3, User Control and Freedom.
No way for a returning visitor to save a rescue — 7, Flexibility and Efficiency of Use.
All rescues and all routes shown at once, crowding the answer — 8, Aesthetic and Minimalist Design.
