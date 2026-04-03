### what and why
i use google to look up japanese words.
i do not have to learn from ai generated stuff while there is native options.
this stuff is annoying bcs it accidentally enters my eyes.

why dont u use other search engine?
i still want benefits from personalized search results and so on.
its much more effort for me to switch to another.
### what works
tested with Tampermonkey and firefox/chrome

only support Japanese locale, you could patch code but i wont maintain for now
### how it works
it greps for at least two some known text or icon patterns and removes the common parent
### limitations
* in some cases ai overviews is visible for some frames
* in some cases whole page will be hidden temporarily
* may break in future if not updated when google updates site
* it only removes the texts, it doesnt fix up padding
### todo
- [ ] test on safari/webkit-based browsers
- [ ] also block AI-generated "People Also Ask" answers
- [ ] test on mobile firefox/chromium-based browsers
- [ ] test other userscript managers
### bonus: why this is still not possible to turn off in settings
maybe google also knows it sucks, so it dont want you to turn it off

like if you disabled now u cant see future improvements of this thing

but they have to ship right now
### license
GLWTPL
