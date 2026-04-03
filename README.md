### what and why
i use google to look up japanese words.
i do not have to learn from ai generated stuff while there is native options.
this stuff is annoying bcs it accidentally enters my eyes.

why dont u use other search engine?
i still want benefits from personalized search results and so on.
its much more effort for me to switch to another.
### what works
tested with Tampermonkey and firefox/chrome (archlinux)

only support Japanese locale, you could patch code but i wont maintain for now
### disclaimers
im not responsible for Google account bans but so far this haven't happened to me

i dont know if it conflicts/breaks with other plugins/scripts
### how it works
it greps for at least two some known text or icon patterns and removes the common parent
### limitations
* in some cases ai overviews is visible for some frames
* in some cases whole page will be hidden temporarily
* may break in future if not updated when google updates site
* it only removes the texts, it doesnt fix up padding
* when the script is outdated or in untested cases, it can accidentally remove innocent search results
* cannot remove titles of ai-generated "People Also Ask" answers
### todo
- [ ] test on safari/webkit-based browsers
- [x] ~~also block AI-generated "People Also Ask" answers~~ (EDIT: nvm, already works)
- [ ] test on mobile firefox/chromium-based browsers
- [ ] test other userscript managers
### bonus: why this is still not possible to turn off in settings
maybe google also knows it sucks, so it dont want you to turn it off

like if you disabled now u cant see future improvements of this thing

but they have to ship right now
### license
GLWTPL
