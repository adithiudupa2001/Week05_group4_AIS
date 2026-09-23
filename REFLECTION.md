REFLECTION.md — Paws & Home SG

Student: Adithi Udupa · Course: MGMT 6110 · Problem Set 1

Q1 — Who are my users, and what changes for them?

My users are external: Singapore residents deciding whether to take in a stray. Mostly first-time adopters, at home on a phone, a few hundred a month. Their job is "find a stray I could give a home to, and know what happens next."

Without the product they scroll scattered shelter posts and message groups, find an animal with a photo and a name, and stop — because nothing tells them what follows if they say yes. Do they visit? Does the animal come to them? Are they alone afterwards? So they message someone and wait.

Two steps go. The health question is answered before it is asked, because vaccinated and dewormed sit in the same place on every card. And "How it works" answers "then what" before they tap anything: a visit happens at our shelter, a completed adoption is hand-delivered. The waiting remains, but it now comes after they understand the process instead of before.

Q2 — Augmented capacity and constrained capacity

Augmented. In 215 seconds I had a running three-screen app of twelve files — data.ts, types.ts, seven components and the shell around them — having never written a line of React. The hours I spent went into deciding what each screen was for, and giving each one an "it worked when" line: the enquiry screen opens for that animal; the form is replaced by a confirmation that names the animal.

Constrained. I could not judge what I could not read. Twelve files came back and I checked my Goal list and nothing else. Stitch had put every invented value in an APP_DATA constant instead of a data file of its own, which is exactly what my OUTPUT block asked for — and I only know because it told me. I did not find it.

Verifying became the bottleneck, and I lost that once. The second build told me "each instance maintains its own isolated React state." I read the sentence. I did not read the state, and I had no check faster than trusting it.

The builder's defaults became my product's defaults. I asked for "soft neutrals with one warm accent"; it chose 
#FAF7F2, 
#C85A32 and Plus Jakarta Sans. I never named an animal; back came Kopi, Milo, Kaya, Pandan, Teh-O, Tofu, Chili and Sesame, found in Bedok, Tuas and Kranji. That is the product's character, and none of it was mine.

Q3 — In the loop, on the loop, out of the loop

Where my judgment changed the outcome. In my third prompt I wrote: "Reuse the existing Support Medical Funds component and the same data rather than copying the text into a second place, so the two can never drift apart. Give the home-screen instance its own state." Left alone it would likely have duplicated the block, and the copies would have disagreed the first time I edited one.

Where I was nominally in the loop and added nothing. The handover to AI Studio was eleven words — "Build me an app with screens that look like this. You can hotlink images from the html" — and twelve files came back, which I accepted on five summary bullets. Worse, that instruction contradicts my own guardrail, "do NOT call any outside service or fetch from any URL." I wrote both lines and did not notice.

Forward. Rendering the rescue cards from the data file should be out of the loop: reversible, checkable at a glance, happening on every load, costing nobody anything when it looks wrong. Before signing that off I would want every row in data.ts validated for required fields, measured as zero rows rendering a blank field across the whole file. The enquiry submission must stay in the loop however expensive it is: it is not reversible once someone is told to expect a hand-delivery, and the error is borne by an adopter and an animal, neither of whom agreed to any of this.

Q4 — What did it build that I never sketched?

It added plenty I never asked for: a Pasir Ris Farmway Sanctuary sidebar, "Care Pillars" and "Singapore Aftercare Promise" as section names, a +65 phone format, a "Back to Meet Rescues" control, and a name for the fund itself — the Stray Medical & Food Fund.

It also decided things I did not know were decisions. Which of my three amounts is the "popular" one. That a visit means "a peaceful bonding slot", and an adoption means "a virtual pre-check", "a starter kit" and "a 60-day volunteer buddy". A real shelter would have to honour every one of those, and I specified none of them.

And it was right where I was wrong: my OUTPUT block asked for the data in one file of its own, Stitch gave me a constant, and the AI Studio build produced src/data.ts and src/types.ts unprompted.

I noticed the fund name only when the label disagreed with itself across screens, which is why my third prompt forced one name everywhere. The "popular" tier and the 60-day buddy I noticed while writing this. To catch them at the time I would have had to open data.ts and read the confirmation strings once after the first build — the two files holding every promise the product makes — instead of reading the summary.

Q5 — Three pointers for the organisational context
Make "list every choice the brief did not specify" a required output, not a courtesy. One line in my CONTEXT block is the only reason I know the palette, the sticky header and the eight animal names were the model's choices and not mine. Without it they become house defaults with no author.
Somebody must read the data file and the user-facing strings, even where nobody reads the generated code. My app shipped "a 60-day volunteer buddy" and "a virtual pre-check" — commitments a shelter would have to keep — and I approved them from five bullets. Sign-off on copy and data belongs to the function that has to honour the promise.
Check the brief against itself before checking the output. I told AI Studio it could hotlink images while my own guardrails forbade fetching from any URL. The contradiction was mine, not the tool's, and two minutes on the prompt would have caught it before 215 seconds of building.
