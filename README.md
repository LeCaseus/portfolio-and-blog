# Portfolio & Blog

This is the repository for my personal website at [cheztervargas.com](https://cheztervargas.com). Feel free to poke around, borrow what you want, or just read this for fun.

> I plan to make a template of this soon, but for now I will fix everything first until its stable and consistent with my vision for the website.

---

## The story

This site has actually been rebuilt four times and each version was an honest reflection of where I was at. (but also because I was bored and couldn't decide on one theme)

### The vibe coded attempt

**v1** started as a Node.js/Express app with a PostgreSQL database hosted on Vercel and Neon iirc. There was no point in building a backend at the time and I knew it, but I did it anyway. I wanted to make my own micro-blogging/blogging platform which was basically me refusing to use Twitter, Threads, Tumblr, and the like. It worked, barely, but I wasn't proud of it. I realized that I had built something that I don't really understand, and couldn't maintain in the long run so, I stripped the backend entirely. Went fully static. The database was overkill for a personal site and I was just worried about getting hacked not knowing how the network works yet.

### First redesign, nothing happened?

**v2** was the editorial brutalist era. Big red typography, my photo against a dark city backdrop, aggressive layout. I just saw this on Pinterest and was fixated on getting noticed by employers and I let that show a little too much. It looked cool to be honest, but it didn't feel like me.

### A better outlook on the vision for the platform

**v3** was the Jekyll diagnostic redesign. I went for a Jekyll SSG because I wanted something to modularize my source code and make things easier to navigate. The site had a dark background, phosphor green accent, biosignal waveforms everywhere, posts called _readings_. The whole site read like a piece of medical equipment. I was happy with the direction. But then I'd realize that jumping across Jekyll files, especially since I've moved to helix, was just a hassle really, and jumping across files just to change one line isn't really it.

### Current awesome live work

So, **v4** is this. Plain HTML, CSS, and JS. No build step, no SSG, no framework. I know I went full circle back to the basics. Nevertheless, I've improved the visual direction from v3, same design language, same waveforms, but now all in one place. The kind of thing you can open, read, and change without switching files. It made sense to go back to basics.

> The plan is to eventually wire up my own C++ backend for the blog and notes, so new posts don't require editing a JS array. But that's a near future project. For now, this is it.

|         |                                            |
| ------- | ------------------------------------------ |
| Hosting | Cloudflared                                |
| Fonts   | Instrument Serif · Inter Tight · Fira Code |
| Styling | Vanilla CSS                                |
| JS      | Vanilla JS                                 |
| Backend | Custom C++ HTTP Server                     |

That old quote block was me one month ago and I am proud to say that I have finally finished building the backend with [cpp-httplib](https://github.com/yhirose/cpp-httplib) and I am now fully selfhosting my website, although not 24/7 because it lives on my laptop and not a dedicated homelab. (yet!)
