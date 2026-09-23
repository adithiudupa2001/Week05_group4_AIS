PROMPTS.md — Paws & Home SG

Student: Adithi Udupa · Course: MGMT 6110 · Problem Set 1

User sentence: A Singapore resident deciding whether to take in a stray opens this app to find a stray they could give a home to and know what happens next, and knows it worked when the enquiry screen names the animal they chose and states the next step.

Live link: https://adithiudupakarkadaweek03assignment.vercel.app

Prompt 1 — the master prompt

Sent to Google Stitch.

ROLE: You are a senior front-end developer building a React web app.

GOAL: Build the front end of Paws & Home SG, a web product for Singapore
residents deciding whether to take in a stray animal — mostly first-time
adopters, at home on a phone, a few hundred a month. Their job on this product
is "find a stray I could give a home to, and know what happens next." Screens:
1) Adopt: a hero with the shelter's one-line tagline and vision statement, then
   a grid of 8 rescue cards — photo, name, approximate age, a two-line story of
   where the animal was found, and two badges, vaccinated and dewormed. Beside
   the grid, a short "How it works" note: a visit happens at our shelter, a
   completed adoption is hand-delivered to your home. Below that, "Our story"
   (street feeding, vaccination and sterilisation, community sheltering) and
   "You are never alone after adoption" (a volunteer buddy, a community
   helpline, subsidised vet partners). The user browses and taps "Schedule a
   visit" or "Adopt me" on one card. It worked when the enquiry screen opens
   for that animal.
2) Enquiry: names the animal and which of the two choices was made, then a form
   — name, email, phone, message — and a submit button. The user fills it in and
   submits. It worked when the form is replaced by a confirmation that names the
   animal and states the next step: come to the shelter for a visit, or wait for
   hand-delivery for an adoption.
3) Support us: three preset contribution amounts and a field for a custom
   amount, for visitors who cannot adopt. The user picks an amount and confirms.
   It worked when a thank-you replaces the amount picker.

OUTPUT: A running app. Keep every invented value in ONE data file of its own,
with at least 8 rows, so the screen looks real. One component per screen or
section. Move between screens without reloading the page. Readable on a phone at
arm's length. When you are done, list the files you created and what each one
holds.

GUARDRAILS: Screens and invented data only. Do NOT call the Gemini API or any
other model. Do NOT call any outside service or fetch from any URL. No database,
no login, no user accounts, no analytics. No features I did not list — no admin
or shelter-staff screens, no payment or checkout, no search, no filters, no map,
no chat widget. No real company's name, logo, or trademark. Invented names and
numbers only, nothing confidential.

CONTEXT: Individual Problem Set 1 for MGMT 6110 Human-AI Collaboration at SMU.
Built in Google AI Studio, shared as a link, and opened on a phone by classmates
in Week 3. I am not a programmer: when you make a choice I did not specify, say
so in one line rather than burying it. The visitor is often nervous about
adopting for the first time, so keep the tone warm and reassuring, not
corporate: soft neutrals with one warm accent, generous whitespace, rounded
cards, a friendly humanist sans-serif.

What came back: A running mobile web app with all three screens. Because the CONTEXT block asked for it, Stitch declared the choices I had not specified: the palette (
#FAF7F2 background, 
#38322E type, 
#C85A32 terracotta accent, Plus Jakarta Sans), a sticky top header toggling between Adopt and Support Us, and eight rescues named after local drinks and pantry staples — Kopi, Milo, Kaya, Pandan, Teh-O, Tofu, Chili, Sesame — with backstories set in Bedok, Tuas, Kranji, Tiong Bahru and Sungei Tengah. Data was held in an APP_DATA constant. Support tiers came back as $20, $50 and $100.

What I changed next and why: Nothing in the prompt. Exported the screens out of Stitch and into Google AI Studio, to get a project I could push to GitHub and deploy.

Prompt 2 — handover to Google AI Studio
Build me an app with screens that look like this. You can hotlink images from
the html

Attached: Image 1.png, Image 2.html, Image 3.png, Image 4.html — the Stitch export.

What came back: Twelve files, built: metadata.json, index.html, src/index.css, src/types.ts, src/data.ts, src/components/Header.tsx, RescueCard.tsx, AdoptScreen.tsx, EnquiryScreen.tsx, SupportScreen.tsx, Footer.tsx, src/App.tsx. On desktop, a twelve-column layout with the eight rescue cards in a two-column grid beside a sticky "How It Works" and Pasir Ris Farmway Sanctuary sidebar, then three-column Care Pillars and Singapore Aftercare Promise sections. On mobile, a single-column flow with 48px tap targets. The enquiry screen pre-populates with the chosen rescue and gives different next steps for a shelter meet-and-greet in Pasir Ris versus home hand-delivery with a 60-day volunteer buddy. Contribution tiers $20, $50 (marked popular) and $100 plus a custom SGD input, named the Stray Medical & Food Fund.

What I changed next and why: The contribution section sat behind its own header button, so a visitor had to leave the home screen to reach it. The next prompt moved that content onto the home screen as well, and changed nothing else.

Prompt 3 — donation section on the home screen
Change one thing: put the Support Medical Funds content on the home screen as
well.

- On the Adopt screen, between "You are never alone after adoption" and the
  footer, add a "Support Medical Funds" section carrying the same content as the
  Support Medical Funds screen: the heading, the line addressed to people who
  cannot adopt, the three preset contribution amounts, the custom amount field,
  the confirm button, and the thank-you state.
- It must work in place. Picking an amount and confirming shows the thank-you
  right there, without leaving the home screen and without a page reload.
- Reuse the existing Support Medical Funds component and the same data rather
  than copying the text into a second place, so the two can never drift apart.
  Give the home-screen instance its own state, so confirming in one place does
  not change the other.
- Leave the Support [paste the rest of this prompt from your AI Studio history]

What came back: Two files edited — src/components/SupportScreen.tsx and src/components/AdoptScreen.tsx. The section was placed between the Singapore Aftercare Promise and the footer on the Adopt screen. It reused the existing SupportScreen component behind an isEmbedded configuration rather than duplicating the markup or text, so the heading, copy, the $20 / $50 / $100 tiers, the custom amount field and the thank-you states stay in sync. Selecting an amount and clicking Confirm Contribution shows the thank-you in place with no reload. Each instance keeps its own React state, so contributing on the home screen does not affect the dedicated Support Medical Fund page. It also added a "Back to Meet Rescues" control that scrolls up to the rescue cards.

What I changed next and why:Nothing, this was the last prompt
