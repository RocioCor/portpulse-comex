# PortPulse

Build a focused tool that solves the problem described below.

MAKE IT YOURS

Who this tool is for: [Customs brokers, importers, and port logistics coordinato]

The task it should help with: [Automating customs cleatance release tracking and 2 hour SIM pickup notifications]

How this works today: [Manual checks on the customs portal every 2 hours to confirm pickup windows, plus tracking release statuses and storage dates via WhatsApp and spreadsheets ]

What goes wrong: [Operators miss the 2 hours SIM action window or lose track of storage expiration dates, causing blocked trucks at port terminals, delayed clearances, and heavy demurrage fees]

Who submits requests: [Logistics operators and customs clearance agents]

Information each request needs: [declaration number, Port/Customs office, Free storage expiration date, 2 hour SIM pickup window status, auto-trigger toggle]

Workflow stages: [pending customs check, sim pickup window active, ready for port pickup, completed]

What success looks like: [The coordinator can automatically trigger 2 hour SIM picup notices and manage release statuses and storage deadlines in a single unified dashboard to eliminate port demurrage fees]

Colors and style: [Dark navy blue, clean white, and high contrast alert badges(green for released, amber for pending window, flash red for expiring storage)]

WHAT TO BUILD

A clear form for submitting the information I listed.

A management view showing submissions, status badges, and filters.

An easy way to update each submission’s status.

A summary showing open requests and, if relevant, items due today.

Keep the first version focused on this one workflow. Use plain language, large mobile-friendly inputs, and clear confirmation after submission. Start with fictional examples. If requesters and managers need different access, explain and set up those permissions before using real information.
me gustaria agregar que se pueda elegir y leer en ambos idiomas ingles y español

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://portpulse-comex.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6187f04a-bdbc-4ca8-a06e-e5e4bc5bd85e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
